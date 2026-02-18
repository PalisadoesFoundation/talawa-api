import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventVolunteerGroupInput,
	eventVolunteerGroupInputSchema,
} from "~/src/graphql/inputs/EventVolunteerGroupInput";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateEventVolunteerGroupArgumentsSchema = z.object({
	data: eventVolunteerGroupInputSchema,
});

/**
 * GraphQL mutation to create an event volunteer group.
 * Based on the old Talawa API createEventVolunteerGroup mutation.
 * Implements exact same logic: reuse existing volunteers, create new ones, create group memberships.
 */
builder.mutationField("createEventVolunteerGroup", (t) =>
	t.field({
		type: EventVolunteerGroup,
		args: {
			data: t.arg({
				required: true,
				type: EventVolunteerGroupInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an event volunteer group.",
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
			} = mutationCreateEventVolunteerGroupArgumentsSchema.safeParse(args);

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

			// Check if leader exists
			const leader = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.data.leaderId),
			});

			if (!leader) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "leaderId"],
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

				// Check if template group already exists
				const existingTemplate = await ctx.drizzleClient
					.select()
					.from(eventVolunteerGroupsTable)
					.where(
						and(
							eq(eventVolunteerGroupsTable.eventId, targetEventId),
							eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
							eq(eventVolunteerGroupsTable.isTemplate, true),
						),
					)
					.limit(1);

				// Check for any instance-specific groups that need to be converted
				const existingInstanceSpecific = await ctx.drizzleClient
					.select()
					.from(eventVolunteerGroupsTable)
					.where(
						and(
							eq(eventVolunteerGroupsTable.eventId, targetEventId),
							eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
							eq(eventVolunteerGroupsTable.isTemplate, false),
						),
					);

				let volunteerGroup: typeof eventVolunteerGroupsTable.$inferSelect;

				if (existingTemplate.length > 0) {
					// Template already exists
					const templateGroup = existingTemplate[0];
					if (!templateGroup) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
					volunteerGroup = templateGroup;

					// Remove any instance-specific groups (conversion to template)
					if (existingInstanceSpecific.length > 0) {
						await ctx.drizzleClient
							.delete(eventVolunteerGroupsTable)
							.where(
								and(
									eq(eventVolunteerGroupsTable.eventId, targetEventId),
									eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
									eq(eventVolunteerGroupsTable.isTemplate, false),
								),
							);
					}

					// Handle volunteer assignments if provided
					if (
						parsedArgs.data.volunteerUserIds &&
						parsedArgs.data.volunteerUserIds.length > 0
					) {
						// Find existing volunteers in the base event
						const volunteers = await ctx.drizzleClient
							.select()
							.from(eventVolunteersTable)
							.where(
								and(
									inArray(
										eventVolunteersTable.userId,
										parsedArgs.data.volunteerUserIds,
									),
									eq(eventVolunteersTable.eventId, targetEventId),
								),
							);

						const existingVolunteerUserIds = volunteers.map(
							(vol) => vol.userId,
						);
						const newVolunteerUserIds = parsedArgs.data.volunteerUserIds.filter(
							(id) => !existingVolunteerUserIds.includes(id),
						);

						// Create new volunteers if needed
						let newVolunteers: (typeof eventVolunteersTable.$inferSelect)[] =
							[];
						if (newVolunteerUserIds.length > 0) {
							newVolunteers = await ctx.drizzleClient
								.insert(eventVolunteersTable)
								.values(
									newVolunteerUserIds.map((userId) => ({
										userId,
										eventId: targetEventId,
										creatorId: currentUserId,
										hasAccepted: false,
										isPublic: true,
										hoursVolunteered: "0",
										isTemplate: true,
										recurringEventInstanceId: null,
									})),
								)
								.returning();
						}

						const allVolunteerIds = [
							...volunteers.map((v) => v.id),
							...newVolunteers.map((v) => v.id),
						];

						// Create group memberships
						await ctx.drizzleClient
							.insert(eventVolunteerMembershipsTable)
							.values(
								allVolunteerIds.map((volunteerId) => ({
									volunteerId,
									groupId: volunteerGroup.id,
									eventId: targetEventId,
									status: "invited" as const,
									createdBy: currentUserId,
								})),
							);
					}

					return volunteerGroup;
				}

				// No template exists - create one
				// First, remove any instance-specific groups
				if (existingInstanceSpecific.length > 0) {
					await ctx.drizzleClient
						.delete(eventVolunteerGroupsTable)
						.where(
							and(
								eq(eventVolunteerGroupsTable.eventId, targetEventId),
								eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
								eq(eventVolunteerGroupsTable.isTemplate, false),
							),
						);
				}

				// Create new template volunteer group
				const [createdGroup] = await ctx.drizzleClient
					.insert(eventVolunteerGroupsTable)
					.values({
						eventId: targetEventId,
						leaderId: parsedArgs.data.leaderId,
						creatorId: currentUserId,
						name: parsedArgs.data.name,
						description: parsedArgs.data.description || null,
						volunteersRequired: parsedArgs.data.volunteersRequired || null,
						isTemplate: true,
						recurringEventInstanceId: null,
					})
					.returning();

				if (createdGroup === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				volunteerGroup = createdGroup;

				// Handle volunteer assignments if provided
				if (
					parsedArgs.data.volunteerUserIds &&
					parsedArgs.data.volunteerUserIds.length > 0
				) {
					// Find existing volunteers in the base event
					const volunteers = await ctx.drizzleClient
						.select()
						.from(eventVolunteersTable)
						.where(
							and(
								inArray(
									eventVolunteersTable.userId,
									parsedArgs.data.volunteerUserIds,
								),
								eq(eventVolunteersTable.eventId, targetEventId),
							),
						);

					const existingVolunteerUserIds = volunteers.map((vol) => vol.userId);
					const newVolunteerUserIds = parsedArgs.data.volunteerUserIds.filter(
						(id) => !existingVolunteerUserIds.includes(id),
					);

					// Create new volunteers if needed
					let newVolunteers: (typeof eventVolunteersTable.$inferSelect)[] = [];
					if (newVolunteerUserIds.length > 0) {
						newVolunteers = await ctx.drizzleClient
							.insert(eventVolunteersTable)
							.values(
								newVolunteerUserIds.map((userId) => ({
									userId,
									eventId: targetEventId,
									creatorId: currentUserId,
									hasAccepted: false,
									isPublic: true,
									hoursVolunteered: "0",
									isTemplate: true,
									recurringEventInstanceId: null,
								})),
							)
							.returning();
					}

					const allVolunteerIds = [
						...volunteers.map((v) => v.id),
						...newVolunteers.map((v) => v.id),
					];

					// Create group memberships
					await ctx.drizzleClient.insert(eventVolunteerMembershipsTable).values(
						allVolunteerIds.map((volunteerId) => ({
							volunteerId,
							groupId: volunteerGroup.id,
							eventId: targetEventId,
							status: "invited" as const,
							createdBy: currentUserId,
						})),
					);
				}

				return volunteerGroup;
			}

			if (scope === "THIS_INSTANCE_ONLY") {
				// Create instance-specific volunteer group directly in the main table
				if (!parsedArgs.data.recurringEventInstanceId) {
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

				// Validate that the recurringInstance exists
				if (!recurringInstance) {
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

				const targetEventId = baseEvent.id;

				// Check if instance-specific group already exists
				const existingGroup = await ctx.drizzleClient
					.select()
					.from(eventVolunteerGroupsTable)
					.where(
						and(
							eq(eventVolunteerGroupsTable.eventId, targetEventId),
							eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
							eq(
								eventVolunteerGroupsTable.recurringEventInstanceId,
								parsedArgs.data.recurringEventInstanceId,
							),
							eq(eventVolunteerGroupsTable.isTemplate, false),
						),
					)
					.limit(1);

				if (existingGroup.length > 0) {
					// Instance-specific group already exists
					return existingGroup[0] as NonNullable<(typeof existingGroup)[0]>;
				}

				// Create new instance-specific volunteer group
				const [createdGroup] = await ctx.drizzleClient
					.insert(eventVolunteerGroupsTable)
					.values({
						eventId: targetEventId,
						leaderId: parsedArgs.data.leaderId,
						creatorId: currentUserId,
						name: parsedArgs.data.name,
						description: parsedArgs.data.description || null,
						volunteersRequired: parsedArgs.data.volunteersRequired || null,
						isTemplate: false,
						recurringEventInstanceId: parsedArgs.data.recurringEventInstanceId,
					})
					.returning();

				if (createdGroup === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Handle volunteer assignments if provided
				if (
					parsedArgs.data.volunteerUserIds &&
					parsedArgs.data.volunteerUserIds.length > 0
				) {
					// Find existing volunteers (prefer instance-specific first, then templates)
					const volunteers = await ctx.drizzleClient
						.select()
						.from(eventVolunteersTable)
						.where(
							and(
								inArray(
									eventVolunteersTable.userId,
									parsedArgs.data.volunteerUserIds,
								),
								eq(eventVolunteersTable.eventId, targetEventId),
								// Allow both template and instance-specific volunteers
							),
						);

					const existingVolunteerUserIds = volunteers.map((vol) => vol.userId);
					const newVolunteerUserIds = parsedArgs.data.volunteerUserIds.filter(
						(id) => !existingVolunteerUserIds.includes(id),
					);

					// Create new instance-specific volunteers if needed
					let newVolunteers: (typeof eventVolunteersTable.$inferSelect)[] = [];
					if (newVolunteerUserIds.length > 0) {
						newVolunteers = await ctx.drizzleClient
							.insert(eventVolunteersTable)
							.values(
								newVolunteerUserIds.map((userId) => ({
									userId,
									eventId: targetEventId,
									creatorId: currentUserId,
									hasAccepted: false,
									isPublic: true,
									hoursVolunteered: "0",
									isTemplate: false,
									recurringEventInstanceId:
										parsedArgs.data.recurringEventInstanceId,
								})),
							)
							.returning();
					}

					const allVolunteerIds = [
						...volunteers.map((v) => v.id),
						...newVolunteers.map((v) => v.id),
					];

					// Create group memberships
					await ctx.drizzleClient.insert(eventVolunteerMembershipsTable).values(
						allVolunteerIds.map((volunteerId) => ({
							volunteerId,
							groupId: createdGroup.id,
							eventId: targetEventId,
							status: "invited" as const,
							createdBy: currentUserId,
						})),
					);
				}

				return createdGroup;
			}
		},
	}),
);
