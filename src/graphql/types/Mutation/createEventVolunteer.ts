import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/VolunteerMembership";
import { eventVolunteerExceptionsTable } from "~/src/drizzle/tables/eventVolunteerExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventVolunteerInput,
	eventVolunteerInputSchema,
} from "~/src/graphql/inputs/EventVolunteerInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationCreateEventVolunteerArgumentsSchema = z.object({
	data: eventVolunteerInputSchema,
});

/**
 * GraphQL mutation to create an event volunteer.
 * Based on the old Talawa API createEventVolunteer mutation.
 */
builder.mutationField("createEventVolunteer", (t) =>
	t.field({
		type: EventVolunteer,
		args: {
			data: t.arg({
				required: true,
				type: EventVolunteerInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an event volunteer.",
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
			} = mutationCreateEventVolunteerArgumentsSchema.safeParse(args);

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

			// Check if user exists
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.data.userId),
			});

			if (!user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "userId"],
							},
						],
					},
				});
			}

			// Template-First Hierarchy: Determine target event
			let recurringInstance:
				| typeof recurringEventInstancesTable.$inferSelect
				| undefined;

			// Template-First: eventId is always the base event, check if recurringEventInstanceId is provided
			if (parsedArgs.data.recurringEventInstanceId) {
				// Get the recurring instance
				recurringInstance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							parsedArgs.data.recurringEventInstanceId,
						),
					});
			}

			// Get the target event (base event)
			const targetEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
				where: eq(eventsTable.id, parsedArgs.data.eventId),
			});

			if (!targetEvent) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "eventId"],
							},
						],
					},
				});
			}

			const baseEvent = targetEvent;

			// Check if current user is authorized (organization admin or event creator)
			const currentUserMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: and(
						eq(organizationMembershipsTable.memberId, currentUserId),
						eq(
							organizationMembershipsTable.organizationId,
							targetEvent.organizationId,
						),
					),
				});

			const isOrgAdmin = currentUserMembership?.role === "administrator";
			const isEventCreator = targetEvent.creatorId === currentUserId;

			if (!isOrgAdmin && !isEventCreator) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Template-First Hierarchy Implementation
			const scope = parsedArgs.data.scope ?? "ENTIRE_SERIES";

			if (scope === "ENTIRE_SERIES") {
				// Create volunteer in base event (template by default)
				const targetEventId = baseEvent.id;

				// Check if volunteer already exists
				const existingVolunteer = await ctx.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(
						and(
							eq(eventVolunteersTable.userId, parsedArgs.data.userId),
							eq(eventVolunteersTable.eventId, targetEventId),
						),
					)
					.limit(1);

				if (existingVolunteer.length > 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["data"],
									message: "User is already a volunteer for this event series",
								},
							],
						},
					});
				}

				// Create template volunteer
				const [createdVolunteer] = await ctx.drizzleClient
					.insert(eventVolunteersTable)
					.values({
						userId: parsedArgs.data.userId,
						eventId: targetEventId,
						creatorId: currentUserId,
						hasAccepted: false,
						isPublic: true,
						hoursVolunteered: "0",
					})
					.returning();

				// Assert that insert succeeded - should always return the created record
				if (!createdVolunteer) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Create volunteer membership record
				await ctx.drizzleClient.insert(volunteerMembershipsTable).values({
					volunteerId: createdVolunteer.id,
					groupId: null,
					eventId: targetEventId,
					status: "invited",
					createdBy: currentUserId,
				});

				return createdVolunteer;
			}

			if (scope === "THIS_INSTANCE_ONLY") {
				// Create template + exceptions for all OTHER instances
				if (!recurringInstance || !parsedArgs.data.recurringEventInstanceId) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["data", "recurringEventInstanceId"],
									message:
										"recurringEventInstanceId is required for THIS_INSTANCE_ONLY scope",
								},
							],
						},
					});
				}

				const targetEventId = baseEvent.id;

				// Check if template volunteer already exists
				const existingVolunteer = await ctx.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(
						and(
							eq(eventVolunteersTable.userId, parsedArgs.data.userId),
							eq(eventVolunteersTable.eventId, targetEventId),
						),
					)
					.limit(1);

				let volunteer: NonNullable<(typeof existingVolunteer)[0]>;
				if (existingVolunteer.length > 0) {
					volunteer = existingVolunteer[0] as NonNullable<
						(typeof existingVolunteer)[0]
					>;
				} else {
					// Create template volunteer
					const [createdVolunteer] = await ctx.drizzleClient
						.insert(eventVolunteersTable)
						.values({
							userId: parsedArgs.data.userId,
							eventId: targetEventId,
							creatorId: currentUserId,
							hasAccepted: false,
							isPublic: true,
							hoursVolunteered: "0",
						})
						.returning();

					// Assert that insert succeeded - should always return the created record
					if (!createdVolunteer) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					volunteer = createdVolunteer;

					// Create volunteer membership record
					await ctx.drizzleClient.insert(volunteerMembershipsTable).values({
						volunteerId: volunteer.id,
						groupId: null,
						eventId: targetEventId,
						status: "invited",
						createdBy: currentUserId,
					});
				}

				// Get all OTHER recurring instances and create exceptions with deleted=true
				const allInstances =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findMany({
						where: eq(
							recurringEventInstancesTable.baseRecurringEventId,
							baseEvent.id,
						),
					});

				const otherInstances = allInstances.filter(
					(instance) =>
						instance.id !== parsedArgs.data.recurringEventInstanceId,
				);

				// Create exceptions for all other instances (deleted=true means hidden from those instances)
				if (otherInstances.length > 0) {
					await ctx.drizzleClient
						.insert(eventVolunteerExceptionsTable)
						.values(
							otherInstances.map((instance) => ({
								volunteerId: volunteer.id,
								recurringEventInstanceId: instance.id,
								participating: false, // Hide from all other instances
								deleted: true, // Legacy field for backward compatibility
								createdBy: currentUserId,
							})),
						)
						.onConflictDoUpdate({
							target: [
								eventVolunteerExceptionsTable.volunteerId,
								eventVolunteerExceptionsTable.recurringEventInstanceId,
							],
							set: {
								participating: false,
								deleted: true, // Keep for backward compatibility
								updatedBy: currentUserId,
								updatedAt: new Date(),
							},
						});
				}

				return volunteer;
			}
		},
	}),
);
