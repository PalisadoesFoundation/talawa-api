import { and, asc, desc, eq, exists, gt, lt, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
	venueBookingsTable,
	venueBookingsTableInsertSchema,
} from "~/src/drizzle/tables/venueBookings";
import type { ExplicitGraphQLContext } from "~/src/graphql/context";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	type EventWithAttachments,
	filterInviteOnlyEvents,
} from "~/src/graphql/types/Query/eventQueries";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	type ParsedDefaultGraphQLConnectionArguments,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Venue } from "./Venue";

const eventsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform(
		(arg: ParsedDefaultGraphQLConnectionArguments, ctx: z.RefinementCtx) => {
			let cursor: z.infer<typeof cursorSchema> | undefined;

			try {
				if (arg.cursor !== undefined) {
					cursor = cursorSchema.parse(
						JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
					);
				}
			} catch (_error) {
				ctx.addIssue({
					code: "custom",
					message: "Not a valid cursor.",
					path: [arg.isInversed ? "before" : "after"],
				});
			}

			return {
				cursor,
				isInversed: arg.isInversed,
				limit: arg.limit,
			};
		},
	);

const cursorSchema = venueBookingsTableInsertSchema
	.pick({
		eventId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		eventId: arg.eventId,
	}));

Venue.implement({
	fields: (t) => ({
		events: t.connection(
			{
				description:
					"GraphQL connection to traverse through the events the venue has been booked for.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				resolve: async (parent, args, ctx: ExplicitGraphQLContext) => {
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
								issues: error.issues.map((issue: z.ZodIssue) => ({
									argumentPath: issue.path,
									message: issue.message,
								})),
							},
						});
					}

					const currentUserId = ctx.currentClient.user.id;

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
										operators.eq(fields.organizationId, parent.organizationId),
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

					if (
						currentUser.role !== "administrator" &&
						(currentUserOrganizationMembership === undefined ||
							currentUserOrganizationMembership.role !== "administrator")
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [
								asc(venueBookingsTable.createdAt),
								asc(venueBookingsTable.eventId),
							]
						: [
								desc(venueBookingsTable.createdAt),
								desc(venueBookingsTable.eventId),
							];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(venueBookingsTable)
										.where(
											and(
												eq(venueBookingsTable.createdAt, cursor.createdAt),
												eq(venueBookingsTable.eventId, cursor.eventId),
												eq(venueBookingsTable.venueId, parent.id),
											),
										),
								),
								eq(venueBookingsTable.venueId, parent.id),
								or(
									and(
										eq(venueBookingsTable.createdAt, cursor.createdAt),
										gt(venueBookingsTable.eventId, cursor.eventId),
									),
									gt(venueBookingsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(venueBookingsTable.venueId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(venueBookingsTable)
										.where(
											and(
												eq(venueBookingsTable.createdAt, cursor.createdAt),
												eq(venueBookingsTable.eventId, cursor.eventId),
												eq(venueBookingsTable.venueId, parent.id),
											),
										),
								),
								eq(venueBookingsTable.venueId, parent.id),
								or(
									and(
										eq(venueBookingsTable.createdAt, cursor.createdAt),
										lt(venueBookingsTable.eventId, cursor.eventId),
									),
									lt(venueBookingsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(venueBookingsTable.venueId, parent.id);
						}
					}

					// Fetch more venue bookings than needed to account for invite-only filtering
					// This ensures we have enough bookings after filtering to fill the requested page
					// Use 2x the limit or limit + 50, whichever is larger, capped at 200
					const fetchLimit = Math.min(Math.max(limit * 2, limit + 50), 200);

					const venueBookings =
						await ctx.drizzleClient.query.venueBookingsTable.findMany({
							columns: {
								createdAt: true,
								eventId: true,
							},
							limit: fetchLimit + 1, // +1 for pagination detection
							orderBy,
							with: {
								event: {
									with: {
										attachmentsWhereEvent: true,
									},
								},
							},
							where,
						});

					if (cursor !== undefined && venueBookings.length === 0) {
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

					// Check which eventIds are recurring instances
					const eventIds = venueBookings.map((booking) => booking.eventId);
					const recurringInstances =
						await ctx.drizzleClient.query.recurringEventInstancesTable.findMany(
							{
								columns: {
									id: true,
									baseRecurringEventId: true,
								},
								where: (fields, operators) =>
									operators.inArray(fields.id, eventIds),
							},
						);
					const recurringInstanceIds = new Set(
						recurringInstances.map((instance) => instance.id),
					);

					// Transform venue bookings to events with attachments
					const eventsWithAttachments: EventWithAttachments[] = venueBookings
						.filter((booking) => booking.event !== null)
						.map((booking) => {
							if (!booking.event) {
								throw new Error("Event should not be null after filter");
							}
							const { attachmentsWhereEvent, ...event } = booking.event;
							const isGenerated = recurringInstanceIds.has(booking.eventId);
							return {
								...event,
								attachments: attachmentsWhereEvent || [],
								eventType: isGenerated
									? ("generated" as const)
									: ("standalone" as const),
							} as EventWithAttachments;
						});

					// Filter invite-only events based on visibility rules
					// This happens before pagination to ensure we have enough events
					const filteredEvents = await filterInviteOnlyEvents({
						events: eventsWithAttachments,
						currentUserId,
						currentUserRole: currentUser.role,
						currentUserOrgMembership: currentUserOrganizationMembership,
						drizzleClient: ctx.drizzleClient,
					});

					// Map back to venue bookings format for pagination
					// Preserve limit + 1 items (limit already includes +1 for pagination detection from transformDefaultGraphQLConnectionArguments)
					// The extra item is needed by transformToDefaultGraphQLConnection to determine hasNextPage/hasPreviousPage
					const filteredBookings = venueBookings
						.filter((booking) =>
							filteredEvents.some((event) => event.id === booking.eventId),
						)
						.slice(0, limit + 1);

					return transformToDefaultGraphQLConnection({
						createCursor: (booking) => ({
							createdAt: booking.createdAt,
							eventId: booking.eventId,
						}),
						createNode: ({ event: { attachmentsWhereEvent, ...event } }) =>
							Object.assign(event, {
								attachments: attachmentsWhereEvent || [],
							}),
						parsedArgs,
						rawNodes: filteredBookings,
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
