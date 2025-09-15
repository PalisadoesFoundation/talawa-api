import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventVolunteerWhereInput,
	eventVolunteerWhereInputSchema,
} from "~/src/graphql/inputs/EventVolunteerWhereInput";
import { EventVolunteersOrderByInput } from "~/src/graphql/inputs/EventVolunteersOrderByInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const queryGetEventVolunteersArgumentsSchema = z.object({
	where: eventVolunteerWhereInputSchema,
	orderBy: z
		.enum(["hoursVolunteered_ASC", "hoursVolunteered_DESC"])
		.nullable()
		.optional(),
});

/**
 * GraphQL query to get event volunteers.
 * Based on the old Talawa API getEventVolunteers query.
 */
builder.queryField("getEventVolunteers", (t) =>
	t.field({
		type: [EventVolunteer],
		args: {
			where: t.arg({
				required: true,
				type: EventVolunteerWhereInput,
				description: "Filter criteria for event volunteers.",
			}),
			orderBy: t.arg({
				required: false,
				type: EventVolunteersOrderByInput,
				description: "Order criteria for event volunteers.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to get event volunteers.",
		resolve: async (_parent, args, ctx) => {
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
			} = queryGetEventVolunteersArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path.map(String),
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// If eventId is provided, check authorization for that event
			if (parsedArgs.where.eventId) {
				const event = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, parsedArgs.where.eventId),
				});

				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["where", "eventId"],
								},
							],
						},
					});
				}

				// Check if current user is authorized to view volunteers for this event
				const currentUserMembership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						where: and(
							eq(organizationMembershipsTable.memberId, currentUserId),
							eq(
								organizationMembershipsTable.organizationId,
								event.organizationId,
							),
						),
					});

				const isOrgAdmin = currentUserMembership?.role === "administrator";
				const isEventCreator = event.creatorId === currentUserId;

				if (!isOrgAdmin && !isEventCreator) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}
			}

			// Build where conditions
			const whereConditions = [];

			if (parsedArgs.where.id) {
				whereConditions.push(eq(eventVolunteersTable.id, parsedArgs.where.id));
			}

			if (parsedArgs.where.eventId) {
				whereConditions.push(
					eq(eventVolunteersTable.eventId, parsedArgs.where.eventId),
				);
			}

			if (parsedArgs.where.hasAccepted !== undefined) {
				whereConditions.push(
					eq(eventVolunteersTable.hasAccepted, parsedArgs.where.hasAccepted),
				);
			}

			// Build order by clause
			let orderByClause;
			if (parsedArgs.orderBy === "hoursVolunteered_ASC") {
				orderByClause = asc(eventVolunteersTable.hoursVolunteered);
			} else if (parsedArgs.orderBy === "hoursVolunteered_DESC") {
				orderByClause = desc(eventVolunteersTable.hoursVolunteered);
			}

			// Handle name filtering with join
			if (parsedArgs.where.name_contains) {
				const volunteersWithNameFilter = await ctx.drizzleClient
					.select({
						volunteer: eventVolunteersTable,
					})
					.from(eventVolunteersTable)
					.leftJoin(usersTable, eq(eventVolunteersTable.userId, usersTable.id))
					.where(
						and(
							...whereConditions,
							ilike(usersTable.name, `%${parsedArgs.where.name_contains}%`),
						),
					)
					.orderBy(orderByClause || asc(eventVolunteersTable.createdAt))
					.execute();

				return volunteersWithNameFilter.map((result) => result.volunteer);
			}

			// Simple query without name filtering
			const volunteers = await ctx.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(orderByClause || asc(eventVolunteersTable.createdAt))
				.execute();

			return volunteers;
		},
	}),
);
