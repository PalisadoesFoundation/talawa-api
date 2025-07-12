import { type InferSelectModel, and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import {
	eventsTable,
	eventsTableInsertSchema,
} from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { Event } from "~/src/graphql/types/Event/Event";
import type { EventAttachment } from "~/src/graphql/types/EventAttachment/EventAttachment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	type ParsedDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import envConfig from "~/src/utilities/graphqLimits";
import {
	type VirtualEventInstance,
	generateVirtualInstances,
} from "~/src/utilities/recurringEventHelpers";
import { Organization } from "./Organization";

// Custom schema for events with higher limits due to virtual instances
const eventsConnectionArgumentsSchema = z.object({
	after: z
		.string()
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	before: z
		.string()
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	first: z
		.number()
		.min(1)
		.max(1000) // Increased limit for events to handle large date ranges with recurring events
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	last: z
		.number()
		.min(1)
		.max(1000) // Increased limit for events
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
});

// Custom transform function for events connection arguments
const transformEventsConnectionArguments = (
	arg: z.infer<typeof eventsConnectionArgumentsSchema> & {
		startDate?: Date;
		endDate?: Date;
		includeRecurring?: boolean;
	},
	ctx: z.RefinementCtx,
) => {
	const transformedArg: ParsedDefaultGraphQLConnectionArguments & {
		dateRange: { start: Date; end: Date };
		includeRecurring: boolean;
	} = {
		cursor: undefined,
		isInversed: false,
		limit: 0,
		dateRange: { start: new Date(), end: new Date() },
		includeRecurring: true,
	};

	const { after, before, first, last, startDate, endDate, includeRecurring } =
		arg;

	// Handle pagination arguments (same logic as defaultGraphQLConnectionArguments)
	if (first !== undefined) {
		if (last !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: `Argument "last" cannot be provided with argument "first".`,
				path: ["last"],
			});
		}

		if (before !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: `Argument "before" cannot be provided with argument "first".`,
				path: ["before"],
			});
		}

		transformedArg.isInversed = false;
		transformedArg.limit = first + 1;

		if (after !== undefined) {
			transformedArg.cursor = after;
		}
	} else if (last !== undefined) {
		if (after !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: `Argument "after" cannot be provided with argument "last".`,
				path: ["after"],
			});
		}

		transformedArg.isInversed = true;
		transformedArg.limit = last + 1;

		if (before !== undefined) {
			transformedArg.cursor = before;
		}
	} else {
		ctx.addIssue({
			code: "custom",
			message: `A non-null value for argument "first" must be provided.`,
			path: ["first"],
		});
		ctx.addIssue({
			code: "custom",
			message: `A non-null value for argument "last" must be provided.`,
			path: ["last"],
		});
	}

	// Handle date range
	if (startDate) {
		transformedArg.dateRange.start = startDate;
	} else {
		// Default start: today at midnight
		transformedArg.dateRange.start.setHours(0, 0, 0, 0);
	}

	if (endDate) {
		transformedArg.dateRange.end = endDate;
	} else {
		// Default end: 3 months from now at end of day
		transformedArg.dateRange.end.setMonth(
			transformedArg.dateRange.end.getMonth() + 3,
		);
		transformedArg.dateRange.end.setHours(23, 59, 59, 999);
	}

	transformedArg.includeRecurring = includeRecurring ?? true;

	return transformedArg;
};

const eventsArgumentsSchema = eventsConnectionArgumentsSchema
	.extend({
		// Add date range filtering for recurring events
		startDate: z.date().optional(),
		endDate: z.date().optional(),
		includeRecurring: z.boolean().optional().default(true),
	})
	.transform((arg, ctx) => {
		const transformed = transformEventsConnectionArguments(arg, ctx);
		let cursor: z.infer<typeof cursorSchema> | undefined = undefined;

		try {
			if (transformed.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(
						Buffer.from(transformed.cursor, "base64url").toString("utf-8"),
					),
				);
			}
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [transformed.isInversed ? "before" : "after"],
			});
		}

		return {
			...transformed,
			cursor,
		};
	});

const cursorSchema = z
	.object({
		id: eventsTableInsertSchema.shape.id.unwrap(),
		startAt: z.string().datetime(),
	})
	.transform((arg) => ({
		id: arg.id,
		startAt: new Date(arg.startAt),
	}));

Organization.implement({
	fields: (t) => ({
		events: t.connection(
			{
				description:
					"GraphQL connection to traverse through the events belonging to the organization. Includes both standalone events and virtual instances from recurring events.",
				args: {
					startDate: t.arg({
						type: "DateTime",
						description: "Start date for filtering events (defaults to today)",
					}),
					endDate: t.arg({
						type: "DateTime",
						description:
							"End date for filtering events (defaults to 3 months from now)",
					}),
					includeRecurring: t.arg({
						type: "Boolean",
						description:
							"Whether to include virtual instances from recurring events (default: true)",
					}),
				},
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				resolve: async (parent, args, ctx) => {
					if (!ctx.currentClient.isAuthenticated) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const {
						data: parsedArgs,
						error,
						success,
					} = eventsArgumentsSchema.safeParse(args);

					if (!success) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: error.issues.map((issue) => ({
									argumentPath: issue.path,
									message: issue.message,
								})),
							},
						});
					}

					const currentUserId = ctx.currentClient.user.id;

					// Check user authentication and organization membership
					const currentUser =
						await ctx.drizzleClient.query.usersTable.findFirst({
							columns: {
								role: true,
							},
							with: {
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.id),
								},
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						});

					if (currentUser === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const currentUserOrganizationMembership =
						currentUser.organizationMembershipsWhereMember[0];

					// Only organization members or global admins can view events
					if (
						currentUser.role !== "administrator" &&
						currentUserOrganizationMembership === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit, dateRange, includeRecurring } =
						parsedArgs;

					// Type definition for events with attachments
					type EventWithAttachments = InferSelectModel<typeof eventsTable> & {
						attachments: EventAttachment[];
					};

					let allEvents: EventWithAttachments[] = [];

					// 1. Query standalone events in date range
					// Include events that overlap with the date range
					const standaloneWhere = and(
						eq(eventsTable.organizationId, parent.id),
						eq(eventsTable.isRecurringTemplate, false),
						// Event overlaps if: event.start <= range.end AND event.end >= range.start
						lte(eventsTable.startAt, dateRange.end),
						gte(eventsTable.endAt, dateRange.start),
					);

					const standaloneEvents =
						await ctx.drizzleClient.query.eventsTable.findMany({
							where: standaloneWhere,
							with: {
								attachmentsWhereEvent: true,
							},
							orderBy: (fields, operators) => [
								operators.asc(fields.startAt),
								operators.asc(fields.id),
							],
						});

					// Add standalone events to the result
					allEvents.push(
						...standaloneEvents.map((event) => ({
							...event,
							attachments: event.attachmentsWhereEvent,
						})),
					);

					// 2. Generate virtual instances from recurring events if requested
					if (includeRecurring) {
						// Get all recurring event templates for this organization
						const recurringTemplates =
							await ctx.drizzleClient.query.eventsTable.findMany({
								where: and(
									eq(eventsTable.organizationId, parent.id),
									eq(eventsTable.isRecurringTemplate, true),
								),
								with: {
									attachmentsWhereEvent: true,
								},
							});

						// Process each recurring template
						for (const template of recurringTemplates) {
							try {
								// Get recurrence rule for this template
								const recurrenceRule =
									await ctx.drizzleClient.query.recurrenceRulesTable.findFirst({
										where: eq(
											recurrenceRulesTable.baseRecurringEventId,
											template.id,
										),
									});

								if (!recurrenceRule) {
									ctx.log.warn(
										`Recurring event template ${template.id} has no recurrence rule`,
									);
									continue;
								}

								// Get exceptions for this recurring event
								const exceptions =
									await ctx.drizzleClient.query.eventExceptionsTable.findMany({
										where: eq(
											eventExceptionsTable.recurringEventId,
											template.id,
										),
									});

								// Generate virtual instances for the date range
								const virtualInstances = generateVirtualInstances(
									template,
									recurrenceRule,
									dateRange.start,
									dateRange.end,
									exceptions,
								);

								// Add attachments to virtual instances (inherited from template)
								const enrichedInstances: (VirtualEventInstance & {
									attachments: EventAttachment[];
								})[] = virtualInstances.map((instance) => ({
									...instance,
									attachments: template.attachmentsWhereEvent,
								}));

								allEvents.push(...enrichedInstances);
							} catch (error) {
								ctx.log.error(
									`Error processing recurring template ${template.id}:`,
									error,
								);
								// Continue processing other templates
							}
						}
					}

					// 3. Sort all events by start time (and then by ID for consistency)
					allEvents.sort((a, b) => {
						const aTime = new Date(a.startAt).getTime();
						const bTime = new Date(b.startAt).getTime();
						if (aTime === bTime) {
							// Secondary sort by ID for consistent ordering
							return a.id.localeCompare(b.id);
						}
						return aTime - bTime;
					});

					// 4. Apply cursor-based pagination
					if (cursor !== undefined) {
						const cursorIndex = allEvents.findIndex(
							(event) =>
								event.id === cursor.id &&
								new Date(event.startAt).getTime() === cursor.startAt.getTime(),
						);

						if (cursorIndex === -1) {
							throw new TalawaGraphQLError({
								extensions: {
									code: "arguments_associated_resources_not_found",
									issues: [
										{
											argumentPath: [isInversed ? "before" : "after"],
										},
									],
								},
							});
						}

						if (isInversed) {
							// For backward pagination, take events before cursor and reverse
							allEvents = allEvents.slice(0, cursorIndex).reverse();
						} else {
							// For forward pagination, take events after cursor
							allEvents = allEvents.slice(cursorIndex + 1);
						}
					}

					// 5. Apply sorting direction for inverse pagination
					if (isInversed && cursor === undefined) {
						allEvents = allEvents.reverse();
					}

					// 6. Apply final limit
					if (allEvents.length > limit) {
						allEvents = allEvents.slice(0, limit);
					}

					// 7. Transform to GraphQL connection format
					return transformToDefaultGraphQLConnection({
						createCursor: (event) =>
							Buffer.from(
								JSON.stringify({
									id: event.id,
									startAt: new Date(event.startAt).toISOString(),
								}),
							).toString("base64url"),
						createNode: (event) => event,
						parsedArgs: { cursor, isInversed, limit },
						rawNodes: allEvents,
					});
				},
				type: Event,
			},
			{
				edgesField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
			{
				nodeField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
		),
	}),
});
