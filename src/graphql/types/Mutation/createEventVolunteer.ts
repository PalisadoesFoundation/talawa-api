import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/EventVolunteerMembership";
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
 * Based on the Talawa API createEventVolunteer mutation.
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
				const targetEventId = baseEvent.id;

				// Check if template volunteer already exists
				const existingTemplate = await ctx.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(
						and(
							eq(eventVolunteersTable.userId, parsedArgs.data.userId),
							eq(eventVolunteersTable.eventId, targetEventId),
							eq(eventVolunteersTable.isTemplate, true),
						),
					)
					.limit(1);

				// Check for any instance-specific volunteers that need to be converted
				const existingInstanceSpecific = await ctx.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(
						and(
							eq(eventVolunteersTable.userId, parsedArgs.data.userId),
							eq(eventVolunteersTable.eventId, targetEventId),
							eq(eventVolunteersTable.isTemplate, false),
						),
					);

				let volunteer: typeof eventVolunteersTable.$inferSelect;

				if (existingTemplate.length > 0) {
					// Template already exists
					const templateVolunteer = existingTemplate[0];
					if (!templateVolunteer) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
					volunteer = templateVolunteer;

					// Remove any instance-specific volunteers (conversion to template)
					if (existingInstanceSpecific.length > 0) {
						await ctx.drizzleClient
							.delete(eventVolunteersTable)
							.where(
								and(
									eq(eventVolunteersTable.userId, parsedArgs.data.userId),
									eq(eventVolunteersTable.eventId, targetEventId),
									eq(eventVolunteersTable.isTemplate, false),
								),
							);
					}
				} else {
					// No template exists - create one
					// First, remove any instance-specific volunteers
					if (existingInstanceSpecific.length > 0) {
						await ctx.drizzleClient
							.delete(eventVolunteersTable)
							.where(
								and(
									eq(eventVolunteersTable.userId, parsedArgs.data.userId),
									eq(eventVolunteersTable.eventId, targetEventId),
									eq(eventVolunteersTable.isTemplate, false),
								),
							);
					}

					// Create new template volunteer
					const [createdVolunteer] = await ctx.drizzleClient
						.insert(eventVolunteersTable)
						.values({
							userId: parsedArgs.data.userId,
							eventId: targetEventId,
							creatorId: currentUserId,
							hasAccepted: false,
							isPublic: true,
							hoursVolunteered: "0",
							isTemplate: true,
							recurringEventInstanceId: null,
						})
						.returning();

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

				return volunteer;
			}

			if (scope === "THIS_INSTANCE_ONLY") {
				// Template-First Hierarchy: THIS_INSTANCE_ONLY creates exceptions
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

				// Check if template volunteer already exists for this user/event
				const existingTemplate = await ctx.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(
						and(
							eq(eventVolunteersTable.userId, parsedArgs.data.userId),
							eq(eventVolunteersTable.eventId, targetEventId),
							eq(eventVolunteersTable.isTemplate, true),
						),
					)
					.limit(1);

				let volunteer: typeof eventVolunteersTable.$inferSelect;

				if (existingTemplate.length > 0) {
					// Template exists - reuse it
					volunteer = existingTemplate[0] as NonNullable<
						(typeof existingTemplate)[0]
					>;
				} else {
					// No template exists - create one
					const [createdVolunteer] = await ctx.drizzleClient
						.insert(eventVolunteersTable)
						.values({
							userId: parsedArgs.data.userId,
							eventId: targetEventId,
							creatorId: currentUserId,
							hasAccepted: false,
							isPublic: true,
							hoursVolunteered: "0",
							isTemplate: true,
							recurringEventInstanceId: null,
						})
						.returning();

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

				// Create exception record for this instance
				await ctx.drizzleClient.insert(eventVolunteerExceptionsTable).values({
					volunteerId: volunteer.id,
					recurringEventInstanceId: parsedArgs.data.recurringEventInstanceId,
					isException: true,
					createdBy: currentUserId,
				});

				return volunteer;
			}
		},
	}),
);
