import { z } from "zod";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	type EventWithAttachments,
	filterInviteOnlyEvents,
	getUnifiedEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries";
import envConfig from "~/src/utilities/graphqLimits";
import {
	type ParsedDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

/**
 * Zod schema for validating and parsing connection arguments for events,
 * with bounded limits (up to 100) chosen to balance pagination needs and performance,
 * including recurring event instances.
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
		.max(100)
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	last: z
		.number()
		.min(1)
		.max(100)
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
});

/**
 * Transforms and validates the connection arguments for event queries,
 * handling pagination logic and setting default date ranges.
 * @param arg - The raw connection arguments.
 * @param ctx - The Zod refinement context for adding issues.
 * @returns - The parsed and validated connection arguments.
 */
const transformEventsConnectionArguments = (
	arg: z.infer<typeof eventsConnectionArgumentsSchema> & {
		startDate?: Date;
		endDate?: Date;
		includeRecurring?: boolean;
		upcomingOnly?: boolean;
	},
	ctx: z.RefinementCtx,
) => {
	const transformedArg: ParsedDefaultGraphQLConnectionArguments & {
		dateRange: { start: Date; end: Date };
		includeRecurring: boolean;
		upcomingOnly: boolean;
	} = {
		cursor: undefined,
		isInversed: false,
		limit: 0,
		dateRange: { start: new Date(), end: new Date() },
		includeRecurring: true,
		upcomingOnly: false,
	};

	const {
		after,
		before,
		first,
		last,
		startDate,
		endDate,
		includeRecurring,
		upcomingOnly,
	} = arg;

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

	if (upcomingOnly) {
		// When upcomingOnly is true, override endDate to current time
		// This ensures we only get events that haven't ended yet
		transformedArg.dateRange.end = new Date();
		transformedArg.upcomingOnly = true;
	} else if (endDate) {
		transformedArg.dateRange.end = endDate;
	} else {
		// Default end: 1 months from now at end of day
		transformedArg.dateRange.end.setMonth(
			transformedArg.dateRange.end.getMonth() + 1,
		);
		transformedArg.dateRange.end.setHours(23, 59, 59, 999);
	}

	transformedArg.includeRecurring = includeRecurring ?? true;
	transformedArg.upcomingOnly = upcomingOnly ?? false;

	return transformedArg;
};

/**
 * Zod schema for validating and parsing the complete set of arguments
 * for the `events` field, including pagination, date range, and recurring event filters.
 */
const eventsArgumentsSchema = eventsConnectionArgumentsSchema
	.extend({
		startDate: z.date().optional(),
		endDate: z.date().optional(),
		includeRecurring: z.boolean().optional().default(true),
		upcomingOnly: z.boolean().optional().default(false),
	})
	.transform((arg, ctx) => {
		const transformed = transformEventsConnectionArguments(arg, ctx);
		let cursor: z.infer<typeof cursorSchema> | undefined;

		try {
			if (transformed.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(
						Buffer.from(transformed.cursor, "base64url").toString("utf-8"),
					),
				);
			}
		} catch (_error) {
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
 * Zod schema for validating and parsing the event cursor,
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
					upcomingOnly: t.arg({
						type: "Boolean",
						description:
							"Filter to only show upcoming events (events that haven't ended yet). When true, overrides endDate to current date.",
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
					const {
						cursor,
						isInversed,
						limit,
						dateRange,
						includeRecurring,
						upcomingOnly,
					} = parsedArgs;

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
						// Adjust date range for upcoming events
						let effectiveStartDate = dateRange.start;
						let effectiveEndDate = dateRange.end;

						if (upcomingOnly) {
							// For upcoming events, start from now and extend to future
							effectiveStartDate = new Date();
							// Set a reasonable future end date (1 year from now) if not specified
							if (dateRange.end <= new Date()) {
								effectiveEndDate = new Date();
								effectiveEndDate.setFullYear(
									effectiveEndDate.getFullYear() + 1,
								);
							} else {
								effectiveEndDate = dateRange.end;
							}
						}

						// Fetch more events than needed to account for invite-only filtering
						// This ensures we have enough events after filtering to fill the requested page
						// Use 2x the limit or limit + 50, whichever is larger, capped at 200
						// Note: 'limit' already includes +1 for pagination detection (set in transformEventsConnectionArguments)
						const fetchLimit = Math.min(Math.max(limit * 2, limit + 50), 200);

						allEvents = await getUnifiedEventsInDateRange(
							{
								organizationId: parent.id,
								startDate: effectiveStartDate,
								endDate: effectiveEndDate,
								includeRecurring,
								limit: fetchLimit, // limit already includes +1 for pagination detection
							},
							ctx.drizzleClient,
							ctx.log,
						);

						// Filter invite-only events based on visibility rules
						// This happens before pagination to ensure we have enough events
						allEvents = await filterInviteOnlyEvents({
							events: allEvents,
							currentUserId,
							currentUserRole: currentUser.role,
							currentUserOrgMembership: currentUserOrganizationMembership,
							drizzleClient: ctx.drizzleClient,
						});

						ctx.log.debug(
							{
								organizationId: parent.id,
								totalEvents: allEvents.length,
								standaloneEvents: allEvents.filter(
									(e) => e.eventType === "standalone",
								).length,
								materializedEvents: allEvents.filter(
									(e) => e.eventType === "generated",
								).length,
								dateRange: {
									start: dateRange.start.toISOString(),
									end: dateRange.end.toISOString(),
								},
							},
							"Retrieved unified events for organization",
						);
					} catch (unifiedQueryError) {
						ctx.log.error(
							{
								organizationId: parent.id,
								error: unifiedQueryError,
							},
							"Failed to retrieve unified events",
						);
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

					// Apply final limit - limit already includes +1 for pagination detection
					// The transform function will trim to (limit - 1) for actual results
					if (allEvents.length > limit) {
						allEvents = allEvents.slice(0, limit);
					}

					// Transform to GraphQL connection format
					return transformToDefaultGraphQLConnection({
						createCursor: (event) => ({
							id: event.id,
							startAt: new Date(event.startAt),
						}),
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
