import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateEntireRecurringEventSeriesInput,
	mutationUpdateEntireRecurringEventSeriesInputSchema,
} from "~/src/graphql/inputs/MutationUpdateEntireRecurringEventSeriesInput";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateEntireRecurringEventSeriesArgumentsSchema = z.object({
	input: mutationUpdateEntireRecurringEventSeriesInputSchema,
});

builder.mutationField("updateEntireRecurringEventSeries", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input for updating all events in a recurring event series.",
				required: true,
				type: MutationUpdateEntireRecurringEventSeriesInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to update all events (past, present, and future) in a recurring event series with conditional field restrictions.",
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
			} = mutationUpdateEntireRecurringEventSeriesArgumentsSchema.safeParse(
				args,
			);

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

			// Get the instance and its base recurring event
			const existingInstance =
				await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
					columns: {
						id: true,
						baseRecurringEventId: true,
						organizationId: true,
						isCancelled: true,
						actualStartTime: true,
						actualEndTime: true,
						recurrenceRuleId: true,
					},
					with: {
						baseRecurringEvent: {
							columns: {
								id: true,
								name: true,
								description: true,
								location: true,
								allDay: true,
								isPublic: true,
								isRegisterable: true,
								isInviteOnly: true,
								organizationId: true,
								creatorId: true,
								startAt: true,
								endAt: true,
							},
						},
						recurrenceRule: {
							columns: {
								id: true,
								originalSeriesId: true,
							},
						},
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				});

			if (existingInstance === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			if (existingInstance.isCancelled) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "id"],
								message: "Cannot update a cancelled recurring event instance.",
							},
						],
					},
				});
			}

			// Check user permissions
			const [currentUser] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserOrganizationMembership =
				existingInstance.organization.membershipsWhereOrganization[0];

			if (
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator") &&
				existingInstance.baseRecurringEvent.creatorId !== currentUserId
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				// Find the original series ID - this tracks the logical series across splits
				const originalSeriesId =
					existingInstance.recurrenceRule.originalSeriesId ||
					existingInstance.recurrenceRuleId;

				// Find all base templates that belong to this logical series (before and after splits)
				const allSeriesTemplates = await tx.query.recurrenceRulesTable.findMany(
					{
						columns: {
							id: true,
							baseRecurringEventId: true,
							originalSeriesId: true,
						},
						with: {
							baseRecurringEvent: {
								columns: {
									id: true,
									name: true,
									description: true,
									location: true,
									allDay: true,
									isPublic: true,
									isRegisterable: true,
									isInviteOnly: true,
								},
							},
						},
						where: (fields, operators) =>
							operators.or(
								operators.eq(fields.id, originalSeriesId),
								operators.eq(fields.originalSeriesId, originalSeriesId),
							),
					},
				);

				ctx.log.info(
					{
						originalSeriesId,
						templateCount: allSeriesTemplates.length,
						templateIds: allSeriesTemplates.map((t) => t.baseRecurringEventId),
					},
					"Found series templates across splits",
				);

				// Prepare update data - only name and description
				const baseEventUpdateData: Partial<typeof eventsTable.$inferInsert> = {
					updaterId: currentUserId,
				};

				// Update name and description (applies to all events including past)
				if (parsedArgs.input.name !== undefined) {
					baseEventUpdateData.name = parsedArgs.input.name;
				}
				if (parsedArgs.input.description !== undefined) {
					baseEventUpdateData.description = parsedArgs.input.description;
				}

				// Update all base template events in the series (across splits)
				for (const template of allSeriesTemplates) {
					await tx
						.update(eventsTable)
						.set(baseEventUpdateData)
						.where(eq(eventsTable.id, template.baseRecurringEventId));
				}

				ctx.log.info(
					{
						templatesUpdated: allSeriesTemplates.length,
						updatedFields: Object.keys(baseEventUpdateData),
					},
					"Updated all base templates in series",
				);

				// Update all instances timestamps across all templates to reflect they've been modified
				for (const template of allSeriesTemplates) {
					await tx
						.update(recurringEventInstancesTable)
						.set({
							lastUpdatedAt: new Date(),
						})
						.where(
							eq(
								recurringEventInstancesTable.baseRecurringEventId,
								template.baseRecurringEventId,
							),
						);
				}

				// Return the updated instance that was originally targeted
				const updatedInstance =
					await tx.query.recurringEventInstancesTable.findFirst({
						columns: {
							id: true,
							actualStartTime: true,
							actualEndTime: true,
							baseRecurringEventId: true,
							isCancelled: true,
							organizationId: true,
							generatedAt: true,
							lastUpdatedAt: true,
							version: true,
							sequenceNumber: true,
							totalCount: true,
							recurrenceRuleId: true,
							originalInstanceStartTime: true,
						},
						with: {
							baseRecurringEvent: {
								columns: {
									id: true,
									name: true,
									description: true,
									location: true,
									allDay: true,
									isPublic: true,
									isRegisterable: true,
									isInviteOnly: true,
									creatorId: true,
									updaterId: true,
									createdAt: true,
									updatedAt: true,
								},
							},
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.id),
					});

				if (updatedInstance === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Return a formatted event object that matches the Event type
				const { id: _baseEventId, ...baseEventData } =
					updatedInstance.baseRecurringEvent;

				return {
					...updatedInstance,
					...baseEventData,
					id: updatedInstance.id,
					baseRecurringEventId: updatedInstance.baseRecurringEventId,
					startAt: updatedInstance.actualStartTime,
					endAt: updatedInstance.actualEndTime,
					recurrenceRuleId: updatedInstance.recurrenceRuleId,
					originalSeriesId: originalSeriesId,
					originalInstanceStartTime: updatedInstance.originalInstanceStartTime,
					hasExceptions: false,
					appliedExceptionData: null,
					exceptionCreatedBy: null,
					exceptionCreatedAt: null,
					attachments: [], // Recurring event instances don't have direct attachments
				};
			});
		},
		type: Event,
	}),
);
