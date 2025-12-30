import { and, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteThisAndFollowingEventsInput,
	mutationDeleteThisAndFollowingEventsInputSchema,
} from "~/src/graphql/inputs/MutationDeleteThisAndFollowingEventsInput";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteThisAndFollowingEventsArgumentsSchema = z.object({
	input: mutationDeleteThisAndFollowingEventsInputSchema,
});

builder.mutationField("deleteThisAndFollowingEvents", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for deleting this and following event instances.",
				required: true,
				type: MutationDeleteThisAndFollowingEventsInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to delete the current instance and all following instances of a recurring event.",
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
			} = mutationDeleteThisAndFollowingEventsArgumentsSchema.safeParse(args);

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

			const [currentUser, existingInstance] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
					columns: {
						id: true,
						actualStartTime: true,
						actualEndTime: true,
						originalInstanceStartTime: true,
						baseRecurringEventId: true,
						isCancelled: true,
						recurrenceRuleId: true,
						organizationId: true,
						originalSeriesId: true,
						generatedAt: true,
						lastUpdatedAt: true,
						version: true,
						sequenceNumber: true,
						totalCount: true,
					},
					with: {
						organization: {
							columns: {
								id: true,
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
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

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

			// Check if instance is already cancelled
			if (existingInstance.isCancelled) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"This recurring event instance has already been cancelled.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingInstance.organization.membershipsWhereOrganization[0];

			// Authorization check
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
				// Calculate the new end date (just before this instance)
				const newEndDate = new Date(
					existingInstance.actualStartTime.getTime() - 1,
				);

				// Update the recurrence rule to end just before this instance
				await tx
					.update(recurrenceRulesTable)
					.set({
						recurrenceEndDate: newEndDate,
						updaterId: currentUserId,
					})
					.where(
						eq(recurrenceRulesTable.id, existingInstance.recurrenceRuleId),
					);

				// First, get all instances that will be deleted to clean up their exceptions
				const instancesToDelete = await tx
					.select({ id: recurringEventInstancesTable.id })
					.from(recurringEventInstancesTable)
					.where(
						and(
							eq(
								recurringEventInstancesTable.originalSeriesId,
								existingInstance.originalSeriesId,
							),
							gte(
								recurringEventInstancesTable.actualStartTime,
								existingInstance.actualStartTime,
							),
						),
					);

				// Delete exceptions for instances that will be deleted
				if (instancesToDelete.length > 0) {
					await tx.delete(eventExceptionsTable).where(
						inArray(
							eventExceptionsTable.recurringEventInstanceId,
							instancesToDelete.map((instance) => instance.id),
						),
					);

					// Also delete action items associated with these instances
					await tx.delete(actionItemsTable).where(
						inArray(
							actionItemsTable.recurringEventInstanceId,
							instancesToDelete.map((instance) => instance.id),
						),
					);
				}

				// Delete all instances from this one forward across all templates in the same logical series
				await tx
					.delete(recurringEventInstancesTable)
					.where(
						and(
							eq(
								recurringEventInstancesTable.originalSeriesId,
								existingInstance.originalSeriesId,
							),
							gte(
								recurringEventInstancesTable.actualStartTime,
								existingInstance.actualStartTime,
							),
						),
					);

				// Return a formatted event object that matches the Event type
				const { id: _baseEventId, ...baseEventData } =
					existingInstance.baseRecurringEvent;
				return {
					...existingInstance,
					...baseEventData,
					id: existingInstance.id,
					baseRecurringEventId: existingInstance.baseRecurringEventId,
					// The following fields are not part of the drizzle schema for recurring event instances, but are required for the GraphQL Event type.
					// They are resolved dynamically. For this mutation, we can provide sensible defaults.
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
