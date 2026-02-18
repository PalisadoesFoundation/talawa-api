import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	VolunteerMembershipInput,
	volunteerMembershipInputSchema,
} from "~/src/graphql/inputs/VolunteerMembershipInput";
import { VolunteerMembership } from "~/src/graphql/types/EventVolunteerMembership/EventVolunteerMembership";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateVolunteerMembershipArgumentsSchema = z.object({
	data: volunteerMembershipInputSchema,
});

/**
 * GraphQL mutation to create a volunteer membership.
 * Based on the old Talawa API createVolunteerMembership mutation.
 */
builder.mutationField("createVolunteerMembership", (t) =>
	t.field({
		type: VolunteerMembership,
		args: {
			data: t.arg({
				required: true,
				type: VolunteerMembershipInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a volunteer membership.",
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
			} = mutationCreateVolunteerMembershipArgumentsSchema.safeParse(args);

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

			// Check if event exists
			const event = await ctx.drizzleClient.query.eventsTable.findFirst({
				where: eq(eventsTable.id, parsedArgs.data.event),
			});

			if (!event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "event"],
							},
						],
					},
				});
			}

			// Handle recurring event scope validation
			let targetEventId = parsedArgs.data.event;
			let isRecurringRelated = event.isRecurringEventTemplate;

			// Check if this is a recurring event instance (has baseRecurringEventId)
			if (!isRecurringRelated) {
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(recurringEventInstancesTable.id, parsedArgs.data.event),
					});
				if (instance) {
					isRecurringRelated = true;
					targetEventId = instance.baseRecurringEventId; // Use the base event for the volunteer record
				}
			}

			if (parsedArgs.data.scope && isRecurringRelated) {
				if (parsedArgs.data.scope === "THIS_INSTANCE_ONLY") {
					// Validate that recurringEventInstanceId is provided
					if (!parsedArgs.data.recurringEventInstanceId) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["data", "recurringEventInstanceId"],
										message:
											"recurringEventInstanceId is required when scope is THIS_INSTANCE_ONLY",
									},
								],
							},
						});
					}

					// Validate that the instance exists and belongs to this recurring event
					const instance =
						await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst(
							{
								where: eq(
									recurringEventInstancesTable.id,
									parsedArgs.data.recurringEventInstanceId,
								),
							},
						);

					if (!instance) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: ["data", "recurringEventInstanceId"],
									},
								],
							},
						});
					}

					if (instance.baseRecurringEventId !== parsedArgs.data.event) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["data", "recurringEventInstanceId"],
										message:
											"Recurring event instance does not belong to the specified event",
									},
								],
							},
						});
					}
				} else if (parsedArgs.data.scope === "ENTIRE_SERIES") {
					// For entire series, we work with the template event (which is already targetEventId)
					if (parsedArgs.data.recurringEventInstanceId) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["data", "recurringEventInstanceId"],
										message:
											"recurringEventInstanceId should not be provided when scope is ENTIRE_SERIES",
									},
								],
							},
						});
					}
				}
			} else if (parsedArgs.data.scope && !event.isRecurringEventTemplate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data", "scope"],
								message: "scope should only be provided for recurring events",
							},
						],
					},
				});
			} else if (!parsedArgs.data.scope && event.isRecurringEventTemplate) {
				// For backwards compatibility, default to ENTIRE_SERIES for recurring events
				parsedArgs.data.scope = "ENTIRE_SERIES";
			}

			// Always create the EventVolunteer record (matching old Talawa API behavior)
			// Find or create EventVolunteer record
			let volunteer = await ctx.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(
					and(
						eq(eventVolunteersTable.userId, parsedArgs.data.userId),
						eq(eventVolunteersTable.eventId, targetEventId),
					),
				)
				.limit(1);

			if (volunteer.length === 0) {
				// Create EventVolunteer if it doesn't exist
				// hasAccepted depends on status (false for requests, true for direct acceptance)
				const volunteerData: {
					userId: string;
					eventId: string;
					creatorId: string;
					hasAccepted: boolean;
					isPublic: boolean;
					hoursVolunteered: string;
					isTemplate: boolean;
					recurringEventInstanceId: string | null;
				} = {
					userId: parsedArgs.data.userId,
					eventId: targetEventId,
					creatorId: currentUserId,
					hasAccepted: parsedArgs.data.status === "accepted",
					isPublic: true,
					hoursVolunteered: "0",
					isTemplate: true, // Default to template
					recurringEventInstanceId: null, // Default to null
				};

				// Set isTemplate and recurringEventInstanceId based on scope
				if (parsedArgs.data.scope === "THIS_INSTANCE_ONLY") {
					volunteerData.isTemplate = false;
					volunteerData.recurringEventInstanceId =
						parsedArgs.data.recurringEventInstanceId || null;
				} else if (parsedArgs.data.scope === "ENTIRE_SERIES") {
					volunteerData.isTemplate = true;
					volunteerData.recurringEventInstanceId = null;
				}

				const [createdVolunteer] = await ctx.drizzleClient
					.insert(eventVolunteersTable)
					.values(volunteerData)
					.returning();

				if (createdVolunteer === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				volunteer = [createdVolunteer];
			}

			// Create the volunteer membership record
			if (!volunteer[0]) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			const [createdMembership] = await ctx.drizzleClient
				.insert(eventVolunteerMembershipsTable)
				.values({
					volunteerId: volunteer[0].id,
					groupId: parsedArgs.data.group || null,
					eventId: parsedArgs.data.event, // Keep original event ID (instance ID) for admin requests screen
					status: parsedArgs.data.status,
					createdBy: currentUserId,
				})
				.returning();

			if (createdMembership === undefined) {
				ctx.log.error(
					"Postgres insert operation did not return the inserted volunteer membership.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdMembership;
		},
	}),
);
