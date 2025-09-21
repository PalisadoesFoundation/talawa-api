import { and, asc, desc, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/VolunteerMembership";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { VolunteerMembershipOrderByInput } from "~/src/graphql/inputs/VolunteerMembershipOrderByInput";
import {
	VolunteerMembershipWhereInput,
	volunteerMembershipWhereInputSchema,
} from "~/src/graphql/inputs/VolunteerMembershipWhereInput";
import { VolunteerMembership } from "~/src/graphql/types/VolunteerMembership/VolunteerMembership";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const queryGetVolunteerMembershipArgumentsSchema = z.object({
	where: volunteerMembershipWhereInputSchema,
	orderBy: z.enum(["createdAt_ASC", "createdAt_DESC"]).nullable().optional(),
});

/**
 * GraphQL query to get volunteer memberships.
 * Based on the old Talawa API getVolunteerMembership query.
 */
builder.queryField("getVolunteerMembership", (t) =>
	t.field({
		type: [VolunteerMembership],
		args: {
			where: t.arg({
				required: true,
				type: VolunteerMembershipWhereInput,
				description: "Filter criteria for volunteer memberships.",
			}),
			orderBy: t.arg({
				required: false,
				type: VolunteerMembershipOrderByInput,
				description: "Order criteria for volunteer memberships.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to get volunteer memberships.",
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
			} = queryGetVolunteerMembershipArgumentsSchema.safeParse(args);

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

			// Build where conditions
			const whereConditions = [];

			if (parsedArgs.where.userId) {
				// Join with EventVolunteer to filter by userId
				whereConditions.push(
					eq(eventVolunteersTable.userId, parsedArgs.where.userId),
				);
			}

			if (parsedArgs.where.eventId) {
				// Check if the requested event is a recurring instance
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							parsedArgs.where.eventId,
						),
					});

				if (instance) {
					// For recurring instances, show both:
					// 1. Requests for this specific instance (THIS_INSTANCE_ONLY)
					// 2. Requests for the entire series (ENTIRE_SERIES stored with base template ID)
					whereConditions.push(
						or(
							eq(volunteerMembershipsTable.eventId, parsedArgs.where.eventId), // Instance requests
							eq(
								volunteerMembershipsTable.eventId,
								instance.baseRecurringEventId,
							), // Series requests
						),
					);
				} else {
					// For non-recurring events or base templates, use direct eventId matching
					whereConditions.push(
						eq(volunteerMembershipsTable.eventId, parsedArgs.where.eventId),
					);
				}
			}

			if (parsedArgs.where.groupId) {
				whereConditions.push(
					eq(volunteerMembershipsTable.groupId, parsedArgs.where.groupId),
				);
			}

			if (parsedArgs.where.status) {
				whereConditions.push(
					eq(volunteerMembershipsTable.status, parsedArgs.where.status),
				);
			}

			// Handle filter for group vs individual memberships
			if (parsedArgs.where.filter === "group") {
				whereConditions.push(isNotNull(volunteerMembershipsTable.groupId));
			} else if (parsedArgs.where.filter === "individual") {
				whereConditions.push(isNull(volunteerMembershipsTable.groupId));
			}

			// Build order by clause
			let orderByClause:
				| ReturnType<typeof asc>
				| ReturnType<typeof desc>
				| undefined;
			if (parsedArgs.orderBy === "createdAt_ASC") {
				orderByClause = asc(volunteerMembershipsTable.createdAt);
			} else if (parsedArgs.orderBy === "createdAt_DESC") {
				orderByClause = desc(volunteerMembershipsTable.createdAt);
			}

			// Query with joins for filtering
			const memberships = await ctx.drizzleClient
				.select({
					membership: volunteerMembershipsTable,
				})
				.from(volunteerMembershipsTable)
				.leftJoin(
					eventVolunteersTable,
					eq(volunteerMembershipsTable.volunteerId, eventVolunteersTable.id),
				)
				.leftJoin(usersTable, eq(eventVolunteersTable.userId, usersTable.id))
				.leftJoin(
					eventsTable,
					eq(volunteerMembershipsTable.eventId, eventsTable.id),
				)
				.where(
					and(
						...whereConditions,
						// Add name filtering if specified
						parsedArgs.where.userName
							? ilike(usersTable.name, `%${parsedArgs.where.userName}%`)
							: undefined,
						// Add event title filtering if specified
						parsedArgs.where.eventTitle
							? ilike(eventsTable.name, `%${parsedArgs.where.eventTitle}%`)
							: undefined,
					),
				)
				.orderBy(orderByClause || asc(volunteerMembershipsTable.createdAt))
				.execute();

			return memberships.map((result) => result.membership);
		},
	}),
);
