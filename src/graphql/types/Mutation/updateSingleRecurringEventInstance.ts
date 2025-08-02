import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateSingleRecurringEventInstanceInput,
	mutationUpdateSingleRecurringEventInstanceInputSchema,
} from "~/src/graphql/inputs/MutationUpdateSingleRecurringEventInstanceInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationUpdateSingleRecurringEventInstanceArgumentsSchema = z.object({
	input: mutationUpdateSingleRecurringEventInstanceInputSchema,
});

builder.mutationField("updateSingleRecurringEventInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input for updating a single instance of a recurring event.",
				required: true,
				type: MutationUpdateSingleRecurringEventInstanceInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to update a single instance of a recurring event without affecting other instances.",
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
			} = mutationUpdateSingleRecurringEventInstanceArgumentsSchema.safeParse(
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

			// Check if instance is cancelled
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

			const currentUserOrganizationMembership =
				existingInstance.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
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

			// Calculate new timing if provided
			let actualStartTime = existingInstance.actualStartTime;
			let actualEndTime = existingInstance.actualEndTime;

			if (parsedArgs.input.startAt || parsedArgs.input.endAt) {
				const originalDuration =
					existingInstance.actualEndTime.getTime() -
					existingInstance.actualStartTime.getTime();

				if (parsedArgs.input.startAt) {
					actualStartTime = parsedArgs.input.startAt;
					// If only startAt is provided, maintain the same duration
					if (!parsedArgs.input.endAt) {
						actualEndTime = new Date(
							actualStartTime.getTime() + originalDuration,
						);
					}
				}

				if (parsedArgs.input.endAt) {
					actualEndTime = parsedArgs.input.endAt;
				}

				// Validate timing
				if (actualEndTime <= actualStartTime) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "endAt"],
									message: `End time must be after start time: ${actualStartTime.toISOString()}.`,
								},
							],
						},
					});
				}
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				// Build exception data from the provided input
				const exceptionData: Record<string, unknown> = {};

				if (parsedArgs.input.name !== undefined) {
					exceptionData.name = parsedArgs.input.name;
				}
				if (parsedArgs.input.description !== undefined) {
					exceptionData.description = parsedArgs.input.description;
				}
				if (parsedArgs.input.location !== undefined) {
					exceptionData.location = parsedArgs.input.location;
				}
				if (parsedArgs.input.allDay !== undefined) {
					exceptionData.allDay = parsedArgs.input.allDay;
				}
				if (parsedArgs.input.isPublic !== undefined) {
					exceptionData.isPublic = parsedArgs.input.isPublic;
				}
				if (parsedArgs.input.isRegisterable !== undefined) {
					exceptionData.isRegisterable = parsedArgs.input.isRegisterable;
				}
				if (parsedArgs.input.startAt !== undefined) {
					exceptionData.startAt = parsedArgs.input.startAt.toISOString();
				}
				if (parsedArgs.input.endAt !== undefined) {
					exceptionData.endAt = parsedArgs.input.endAt.toISOString();
				}

				// Check if exception already exists
				const existingException = await tx.query.eventExceptionsTable.findFirst(
					{
						where: eq(
							eventExceptionsTable.recurringEventInstanceId,
							parsedArgs.input.id,
						),
					},
				);

				if (existingException) {
					const mergedExceptionData = {
						...(existingException.exceptionData as Record<string, unknown>),
						...exceptionData,
					};

					// Update existing exception
					await tx
						.update(eventExceptionsTable)
						.set({
							exceptionData: mergedExceptionData,
							updaterId: currentUserId,
							updatedAt: new Date(),
						})
						.where(eq(eventExceptionsTable.id, existingException.id));
				} else {
					// Create new exception
					await tx.insert(eventExceptionsTable).values({
						recurringEventInstanceId: parsedArgs.input.id,
						baseRecurringEventId: existingInstance.baseRecurringEventId,
						exceptionData,
						organizationId: existingInstance.organizationId,
						creatorId: currentUserId,
					});
				}

				// Update instance timing if changed
				const instanceUpdateData: Partial<
					typeof recurringEventInstancesTable.$inferInsert
				> = {
					lastUpdatedAt: new Date(),
				};

				if (actualStartTime !== existingInstance.actualStartTime) {
					instanceUpdateData.actualStartTime = actualStartTime;
				}
				if (actualEndTime !== existingInstance.actualEndTime) {
					instanceUpdateData.actualEndTime = actualEndTime;
				}

				const [updatedInstance] = await tx
					.update(recurringEventInstancesTable)
					.set(instanceUpdateData)
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
				// Apply the exception data to the base template
				const { id: _baseEventId, ...baseEventData } =
					existingInstance.baseRecurringEvent;

				const resolvedEventData = {
					...baseEventData,
					...Object.fromEntries(
						Object.entries(exceptionData).filter(
							([key]) => !["startAt", "endAt"].includes(key),
						),
					),
				};

				return {
					...existingInstance,
					...resolvedEventData,
					...updatedInstance,
					id: updatedInstance.id,
					baseRecurringEventId: existingInstance.baseRecurringEventId,
					startAt: updatedInstance.actualStartTime,
					endAt: updatedInstance.actualEndTime,
					// The following fields are required for the GraphQL Event type
					hasExceptions: true,
					appliedExceptionData: exceptionData,
					exceptionCreatedBy: currentUserId,
					exceptionCreatedAt: new Date(),
					attachments: [], // Recurring event instances don't have direct attachments
				};
			});
		},
		type: Event,
	}),
);
