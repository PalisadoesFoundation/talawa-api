import { eq } from "drizzle-orm";
import { z } from "zod";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteSingleEventInstanceInput,
	mutationDeleteSingleEventInstanceInputSchema,
} from "~/src/graphql/inputs/MutationDeleteSingleEventInstanceInput";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteSingleEventInstanceArgumentsSchema = z.object({
	input: mutationDeleteSingleEventInstanceInputSchema,
});

builder.mutationField("deleteSingleEventInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input for deleting a single instance of a recurring event.",
				required: true,
				type: MutationDeleteSingleEventInstanceInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to delete (cancel) a single instance of a recurring event.",
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
			} = mutationDeleteSingleEventInstanceArgumentsSchema.safeParse(args);

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
						isCancelled: true,
						actualStartTime: true,
						actualEndTime: true,
						baseRecurringEventId: true,
						recurrenceRuleId: true,
						originalInstanceStartTime: true,
						organizationId: true,
						generatedAt: true,
						lastUpdatedAt: true,
						version: true,
						sequenceNumber: true,
						totalCount: true,
					},
					with: {
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
				// First, delete action items associated with this specific instance
				await tx
					.delete(actionItemsTable)
					.where(
						eq(actionItemsTable.recurringEventInstanceId, parsedArgs.input.id),
					);

				const [updatedInstance] = await tx
					.update(recurringEventInstancesTable)
					.set({
						isCancelled: true,
						lastUpdatedAt: new Date(),
					})
					.where(eq(recurringEventInstancesTable.id, parsedArgs.input.id))
					.returning();

				if (updatedInstance === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Return a formatted event object that matches the Event type
				const { id: _baseEventId, ...baseEventData } =
					existingInstance.baseRecurringEvent;
				return {
					...existingInstance,
					...baseEventData,
					...updatedInstance,
					id: updatedInstance.id,
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
