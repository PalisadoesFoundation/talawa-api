import { z } from "zod";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	type EventWithAttachments,
	getUnifiedEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	type ParsedDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import envConfig from "~/src/utilities/graphqLimits";
import { Organization } from "./Organization";

/**
 * @description Zod schema for validating and parsing connection arguments for events,
 * with increased limits to accommodate recurring event instances.
 */
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
		.max(1000)
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	last: z
		.number()
		.min(1)
		.max(1000)
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
});

/**
 * @description Transforms and validates the connection arguments for event queries,
 * handling pagination logic and setting default date ranges.
 * @param arg - The raw connection arguments.
 * @param ctx - The Zod refinement context for adding issues.
 * @returns The parsed and validated connection arguments.
 */
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

/**
 * @description Zod schema for validating and parsing the complete set of arguments
 * for the `events` field, including pagination, date range, and recurring event filters.
 */
const eventsArgumentsSchema = eventsConnectionArgumentsSchema
	.extend({
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

/**
 * @description Zod schema for validating and parsing the event cursor,
 * which is used for pagination.
 */
const cursorSchema = z
	.object({
		id: z.string(),
		startAt: z.string(),
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
					"GraphQL connection to traverse through the events belonging to the organization. Includes both standalone events and materialized instances from recurring events. Uses pure materialized approach - no virtual instances.",
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
							"Whether to include materialized instances from recurring events (default: true)",
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
					const { cursor, isInversed, limit, dateRange, includeRecurring } =
						parsedArgs;

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

					// Get unified events using the new query module
					let allEvents: EventWithAttachments[] = [];

					try {
						allEvents = await getUnifiedEventsInDateRange(
							{
								organizationId: parent.id,
								startDate: dateRange.start,
								endDate: dateRange.end,
								includeRecurring,
								limit: limit - 1, // Reserve one spot for pagination logic
							},
							ctx.drizzleClient,
							ctx.log,
						);

						ctx.log.debug("Retrieved unified events for organization", {
							organizationId: parent.id,
							totalEvents: allEvents.length,
							standaloneEvents: allEvents.filter(
								(e) => e.eventType === "standalone",
							).length,
							materializedEvents: allEvents.filter(
								(e) => e.eventType === "materialized",
							).length,
							dateRange: {
								start: dateRange.start.toISOString(),
								end: dateRange.end.toISOString(),
							},
						});
					} catch (unifiedQueryError) {
						ctx.log.error("Failed to retrieve unified events", {
							organizationId: parent.id,
							error: unifiedQueryError,
						});
						throw new TalawaGraphQLError({
							message: "Failed to retrieve events",
							extensions: {
								code: "unexpected",
							},
						});
					}

					// Apply cursor-based pagination
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

					// Apply sorting direction for inverse pagination
					if (isInversed && cursor === undefined) {
						allEvents = allEvents.reverse();
					}

					// Apply final limit
					if (allEvents.length > limit) {
						allEvents = allEvents.slice(0, limit);
					}

					// Transform to GraphQL connection format
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
