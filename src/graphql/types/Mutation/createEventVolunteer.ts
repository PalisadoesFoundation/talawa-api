import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventVolunteerInput,
	eventVolunteerInputSchema,
} from "~/src/graphql/inputs/EventVolunteerInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
			async function ensureVolunteerMembership(
				tx: typeof ctx.drizzleClient,
				volunteerId: string,
				eventId: string,
				createdBy: string,
			) {
				const existingMembership =
					await tx.query.eventVolunteerMembershipsTable.findFirst({
						where: and(
							eq(eventVolunteerMembershipsTable.volunteerId, volunteerId),
							eq(eventVolunteerMembershipsTable.eventId, eventId),
						),
					});

				if (!existingMembership) {
					await tx.insert(eventVolunteerMembershipsTable).values({
						volunteerId,
						groupId: null,
						eventId,
						status: "invited",
						createdBy,
					});
				}
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
				return await ctx.drizzleClient.transaction(async (tx) => {
					await tx
						.select()
						.from(eventsTable)
						.where(eq(eventsTable.id, targetEventId))
						.for("update");
					await tx
						.delete(eventVolunteersTable)
						.where(
							and(
								eq(eventVolunteersTable.userId, parsedArgs.data.userId),
								eq(eventVolunteersTable.eventId, targetEventId),
								eq(eventVolunteersTable.isTemplate, false),
							),
						);
					// check if a template volunteer already exists for this user and event
					const existingTemplate =
						await tx.query.eventVolunteersTable.findFirst({
							where: and(
								eq(eventVolunteersTable.userId, parsedArgs.data.userId),
								eq(eventVolunteersTable.eventId, targetEventId),
								eq(eventVolunteersTable.isTemplate, true),
							),
						});
					let volunteer: typeof eventVolunteersTable.$inferSelect | null = null;
					if (existingTemplate) {
						volunteer = existingTemplate ?? null;
					} else {
						const [created] = await tx
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

						volunteer = created ?? null;
					}
					if (!volunteer) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
					await ensureVolunteerMembership(
						tx,
						volunteer.id,
						targetEventId,
						currentUserId,
					);

					return volunteer;
				});
			}

			if (scope === "THIS_INSTANCE_ONLY") {
				const targetEventId = baseEvent.id;
				return await ctx.drizzleClient.transaction(async (tx) => {
					// Create instance-specific volunteer directly in the main table
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
					// Lock the event row to prevent concurrent modifications
					await tx
						.select()
						.from(eventsTable)
						.where(eq(eventsTable.id, targetEventId))
						.for("update");

					// Check if a volunteer record already exists for this user and event instance
					let volunteer =
						(await tx.query.eventVolunteersTable.findFirst({
							where: and(
								eq(eventVolunteersTable.userId, parsedArgs.data.userId),
								eq(eventVolunteersTable.eventId, targetEventId),
								eq(
									eventVolunteersTable.recurringEventInstanceId,
									parsedArgs.data.recurringEventInstanceId,
								),
								eq(eventVolunteersTable.isTemplate, false),
							),
						})) ?? null;
					// If no instance-specific volunteer exists, create one (even if a template exists, since this is instance-specific)
					if (!volunteer) {
						const [created] = await tx
							.insert(eventVolunteersTable)
							.values({
								userId: parsedArgs.data.userId,
								eventId: targetEventId,
								creatorId: currentUserId,
								hasAccepted: false,
								isPublic: true,
								hoursVolunteered: "0",
								isTemplate: false,
								recurringEventInstanceId:
									parsedArgs.data.recurringEventInstanceId,
							})
							.returning();

						volunteer = created ?? null;
					}

					if (!volunteer) {
						throw new TalawaGraphQLError({
							extensions: { code: "unexpected" },
						});
					}

					await ensureVolunteerMembership(
						tx,
						volunteer.id,
						targetEventId,
						currentUserId,
					);

					return volunteer;
				});
			}
		},
	}),
);
