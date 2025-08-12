import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateThisAndFollowingEventsInput,
	mutationUpdateThisAndFollowingEventsInputSchema,
} from "~/src/graphql/inputs/MutationUpdateThisAndFollowingEventsInput";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	generateInstancesForRecurringEvent,
	initializeGenerationWindow,
} from "~/src/services/eventGeneration";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	applyRecurrenceOverrides,
	buildRRuleString,
	validateRecurrenceInput,
} from "~/src/utilities/recurringEventHelpers";

const mutationUpdateThisAndFollowingEventsArgumentsSchema = z.object({
	input: mutationUpdateThisAndFollowingEventsInputSchema,
});

builder.mutationField("updateThisAndFollowingEvents", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input for updating this and following instances of a recurring event.",
				required: true,
				type: MutationUpdateThisAndFollowingEventsInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to update the current instance and all following instances of a recurring event using the split strategy.",
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
			} = mutationUpdateThisAndFollowingEventsArgumentsSchema.safeParse(args);

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

			// Get the original instance with all related data we need for the new series
			const existingInstance =
				await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
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
								organizationId: true,
								startAt: true,
								endAt: true,
							},
						},
						recurrenceRule: {
							columns: {
								id: true,
								frequency: true,
								interval: true,
								recurrenceStartDate: true,
								recurrenceEndDate: true,
								count: true,
								byDay: true,
								byMonth: true,
								byMonthDay: true,
								originalSeriesId: true,
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

			return await ctx.drizzleClient.transaction(async (tx) => {
				const currentUserId = ctx.currentClient.user?.id;

				if (!currentUserId) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Only split when there's a recurrence pattern change
				// Timing and metadata changes can be applied to the existing template
				const needsSplit = parsedArgs.input.recurrence !== undefined;

				if (!needsSplit) {
					// Update template and apply timing changes to future instances only
					const baseEventUpdateData: Partial<typeof eventsTable.$inferInsert> =
						{
							updaterId: currentUserId,
						};

					// Update metadata fields
					if (parsedArgs.input.name !== undefined) {
						baseEventUpdateData.name = parsedArgs.input.name;
					}
					if (parsedArgs.input.description !== undefined) {
						baseEventUpdateData.description = parsedArgs.input.description;
					}
					if (parsedArgs.input.location !== undefined) {
						baseEventUpdateData.location = parsedArgs.input.location;
					}
					if (parsedArgs.input.allDay !== undefined) {
						baseEventUpdateData.allDay = parsedArgs.input.allDay;
					}
					if (parsedArgs.input.isPublic !== undefined) {
						baseEventUpdateData.isPublic = parsedArgs.input.isPublic;
					}
					if (parsedArgs.input.isRegisterable !== undefined) {
						baseEventUpdateData.isRegisterable =
							parsedArgs.input.isRegisterable;
					}

					// Handle timing changes
					if (
						parsedArgs.input.startAt !== undefined ||
						parsedArgs.input.endAt !== undefined
					) {
						// Calculate timing deltas for existing template
						const originalStartTime =
							existingInstance.baseRecurringEvent.startAt;
						const originalEndTime = existingInstance.baseRecurringEvent.endAt;
						const originalDuration =
							originalEndTime.getTime() - originalStartTime.getTime();

						const newStartTime = parsedArgs.input.startAt || originalStartTime;
						const newEndTime =
							parsedArgs.input.endAt ||
							new Date(newStartTime.getTime() + originalDuration);

						baseEventUpdateData.startAt = newStartTime;
						baseEventUpdateData.endAt = newEndTime;

						// Calculate deltas for updating future instances
						const startTimeDelta =
							newStartTime.getTime() - originalStartTime.getTime();
						const endTimeDelta =
							newEndTime.getTime() - originalEndTime.getTime();

						// Update future instances with new timing
						const futureInstances = await tx
							.select({
								id: recurringEventInstancesTable.id,
								actualStartTime: recurringEventInstancesTable.actualStartTime,
								actualEndTime: recurringEventInstancesTable.actualEndTime,
							})
							.from(recurringEventInstancesTable)
							.where(
								and(
									eq(
										recurringEventInstancesTable.baseRecurringEventId,
										existingInstance.baseRecurringEventId,
									),
									gte(
										recurringEventInstancesTable.actualStartTime,
										existingInstance.actualStartTime,
									),
								),
							);

						// Update each future instance with new timing
						for (const instance of futureInstances) {
							const newInstanceStartTime = new Date(
								instance.actualStartTime.getTime() + startTimeDelta,
							);
							const newInstanceEndTime = new Date(
								instance.actualEndTime.getTime() + endTimeDelta,
							);

							await tx
								.update(recurringEventInstancesTable)
								.set({
									actualStartTime: newInstanceStartTime,
									actualEndTime: newInstanceEndTime,
									lastUpdatedAt: new Date(),
								})
								.where(eq(recurringEventInstancesTable.id, instance.id));
						}

						ctx.log.info("Updated timing for future instances", {
							futureInstancesCount: futureInstances.length,
							startTimeDelta,
							endTimeDelta,
						});
					} else {
						// Just update timestamps for future instances
						await tx
							.update(recurringEventInstancesTable)
							.set({
								lastUpdatedAt: new Date(),
							})
							.where(
								and(
									eq(
										recurringEventInstancesTable.baseRecurringEventId,
										existingInstance.baseRecurringEventId,
									),
									gte(
										recurringEventInstancesTable.actualStartTime,
										existingInstance.actualStartTime,
									),
								),
							);
					}

					// Update the base template
					await tx
						.update(eventsTable)
						.set(baseEventUpdateData)
						.where(eq(eventsTable.id, existingInstance.baseRecurringEventId));

					ctx.log.info("Updated base template and future instances", {
						baseRecurringEventId: existingInstance.baseRecurringEventId,
						updatedFields: Object.keys(baseEventUpdateData),
					});

					// Return the same instance with updated metadata
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
										creatorId: true,
										updaterId: true,
										createdAt: true,
										updatedAt: true,
									},
								},
							},
							where: (fields, operators) =>
								operators.eq(fields.id, existingInstance.id),
						});

					if (updatedInstance === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

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
						originalSeriesId:
							existingInstance.recurrenceRule.originalSeriesId ||
							existingInstance.recurrenceRuleId,
						originalInstanceStartTime:
							updatedInstance.originalInstanceStartTime,
						hasExceptions: false,
						appliedExceptionData: null,
						exceptionCreatedBy: null,
						exceptionCreatedAt: null,
						attachments: [],
					};
				}

				// Complex changes requiring split - use original logic
				// Step 1: Delete all instances from this one forward (including this instance)
				// First delete the instances to avoid constraint issues
				const deletedInstances = await tx
					.delete(recurringEventInstancesTable)
					.where(
						and(
							eq(
								recurringEventInstancesTable.baseRecurringEventId,
								existingInstance.baseRecurringEventId,
							),
							gte(
								recurringEventInstancesTable.actualStartTime,
								existingInstance.actualStartTime,
							),
						),
					)
					.returning({ id: recurringEventInstancesTable.id });

				ctx.log.info("Deleted old instances", {
					baseRecurringEventId: existingInstance.baseRecurringEventId,
					deletedCount: deletedInstances.length,
					fromStartTime: existingInstance.actualStartTime.toISOString(),
				});

				// Then update the recurrence rule to end just before this instance
				const newEndDate = new Date(
					existingInstance.actualStartTime.getTime() - 1,
				);

				// Note: We allow ending the recurrence before the original start date
				// because we're splitting the series and the old rule may have no valid instances left

				await tx
					.update(recurrenceRulesTable)
					.set({
						recurrenceEndDate: newEndDate,
						updaterId: currentUserId,
					})
					.where(
						eq(recurrenceRulesTable.id, existingInstance.recurrenceRuleId),
					);

				// Step 2: Create new event with updated properties (implementing createEvent logic)
				const originalEvent = existingInstance.baseRecurringEvent;
				const originalRecurrence = existingInstance.recurrenceRule;

				// Calculate timing - use provided times or maintain original timing relative to the instance
				const originalDuration =
					existingInstance.actualEndTime.getTime() -
					existingInstance.actualStartTime.getTime();
				const newStartTime =
					parsedArgs.input.startAt || existingInstance.actualStartTime;
				const newEndTime =
					parsedArgs.input.endAt ||
					new Date(newStartTime.getTime() + originalDuration);

				// Apply calendar-style override logic for recurrence
				const recurrenceInput = applyRecurrenceOverrides(
					parsedArgs.input.startAt,
					originalRecurrence,
					parsedArgs.input.recurrence,
				);

				ctx.log.info("Recurrence override applied", {
					originalRecurrence: {
						frequency: originalRecurrence.frequency,
						interval: originalRecurrence.interval,
						byDay: originalRecurrence.byDay,
						byMonth: originalRecurrence.byMonth,
						byMonthDay: originalRecurrence.byMonthDay,
					},
					inputRecurrence: parsedArgs.input.recurrence,
					newStartAt: parsedArgs.input.startAt?.toISOString(),
					resultingRecurrence: recurrenceInput,
				});

				const validationResult = validateRecurrenceInput(
					recurrenceInput,
					newStartTime,
				);

				if (!validationResult.isValid) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: validationResult.errors.map((error) => ({
								argumentPath: ["input", "recurrence"],
								message: error,
							})),
						},
					});
				}

				// Create the new base event
				const [createdEvent] = await tx
					.insert(eventsTable)
					.values({
						creatorId: currentUserId,
						description:
							parsedArgs.input.description ?? originalEvent.description,
						endAt: newEndTime,
						name: parsedArgs.input.name ?? originalEvent.name,
						organizationId: originalEvent.organizationId,
						startAt: newStartTime,
						allDay: parsedArgs.input.allDay ?? originalEvent.allDay,
						isPublic: parsedArgs.input.isPublic ?? originalEvent.isPublic,
						isRegisterable:
							parsedArgs.input.isRegisterable ?? originalEvent.isRegisterable,
						location: parsedArgs.input.location ?? originalEvent.location,
						isRecurringEventTemplate: true,
					})
					.returning();

				if (!createdEvent) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							message: "Failed to create the new event template.",
						},
					});
				}

				ctx.log.info("Created new base event", {
					newEventId: createdEvent.id,
					newStartTime: newStartTime.toISOString(),
					newEndTime: newEndTime.toISOString(),
				});

				// Build RRULE string
				const rruleString = buildRRuleString(recurrenceInput, newStartTime);

				// Create recurrence rule
				const [createdRecurrenceRule] = await tx
					.insert(recurrenceRulesTable)
					.values({
						recurrenceRuleString: rruleString,
						frequency: recurrenceInput.frequency,
						interval: recurrenceInput.interval || 1,
						recurrenceStartDate: newStartTime,
						recurrenceEndDate: recurrenceInput.endDate || null,
						count: recurrenceInput.count || null,
						latestInstanceDate: newStartTime,
						byDay: recurrenceInput.byDay,
						byMonth: recurrenceInput.byMonth,
						byMonthDay: recurrenceInput.byMonthDay,
						baseRecurringEventId: createdEvent.id,
						originalSeriesId:
							existingInstance.recurrenceRule.originalSeriesId ||
							existingInstance.recurrenceRuleId,
						organizationId: originalEvent.organizationId,
						creatorId: currentUserId,
					})
					.returning();

				if (createdRecurrenceRule === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Get existing window config or create one
				let windowConfig = await tx.query.eventGenerationWindowsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.eq(fields.organizationId, originalEvent.organizationId),
					},
				);

				if (!windowConfig) {
					// Initialize generation window for the organization
					windowConfig = await initializeGenerationWindow(
						{
							organizationId: originalEvent.organizationId,
							createdById: currentUserId,
						},
						tx,
						ctx.log,
					);
				}

				// Calculate window dates from the existing window
				const now = new Date();
				const windowStartDate = new Date(
					Math.min(newStartTime.getTime(), now.getTime()),
				);
				const windowEndDate = new Date(windowStartDate);
				windowEndDate.setMonth(
					windowEndDate.getMonth() + windowConfig.hotWindowMonthsAhead,
				);

				// Generate instances for the new recurring event
				const newInstancesCount = await generateInstancesForRecurringEvent(
					{
						baseRecurringEventId: createdEvent.id,
						organizationId: originalEvent.organizationId,
						windowStartDate,
						windowEndDate,
					},
					tx,
					ctx.log,
				);

				ctx.log.info("Generated new instances", {
					newBaseEventId: createdEvent.id,
					generatedInstancesCount: newInstancesCount,
					windowStart: windowStartDate.toISOString(),
					windowEnd: windowEndDate.toISOString(),
				});

				// Return the first instance (which represents the updated target instance)
				const firstInstance =
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
						},
						where: (fields, operators) =>
							operators.eq(fields.baseRecurringEventId, createdEvent.id),
						orderBy: (fields, operators) => [
							operators.asc(fields.actualStartTime),
						],
					});

				if (firstInstance === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Return a formatted event object that matches the Event type
				return {
					...firstInstance,
					...createdEvent,
					id: firstInstance.id,
					baseRecurringEventId: firstInstance.baseRecurringEventId,
					startAt: firstInstance.actualStartTime,
					endAt: firstInstance.actualEndTime,
					hasExceptions: false,
					appliedExceptionData: null,
					exceptionCreatedBy: null,
					exceptionCreatedAt: null,
					attachments: [],
				};
			});
		},
		type: Event,
	}),
);
