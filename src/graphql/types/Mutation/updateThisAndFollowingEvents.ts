import { and, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
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
import envConfig from "~/src/utilities/graphqLimits";
import {
	applyRecurrenceOverrides,
	buildRRuleString,
	validateRecurrenceInput,
} from "~/src/utilities/recurringEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
								isInviteOnly: true,
								organizationId: true,
								startAt: true,
								endAt: true,
								creatorId: true,
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

			const currentUserId = ctx.currentClient.user.id;
			const [currentUser, currentUserOrganizationMembership] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.memberId, currentUserId),
								operators.eq(
									fields.organizationId,
									existingInstance.organizationId,
								),
							),
					}),
				]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

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

			// Validate visibility consistency (cannot be both public and invite-only)
			const finalIsPublic =
				parsedArgs.input.isPublic ??
				existingInstance.baseRecurringEvent.isPublic;
			const finalIsInviteOnly =
				parsedArgs.input.isInviteOnly ??
				existingInstance.baseRecurringEvent.isInviteOnly;

			if (finalIsPublic && finalIsInviteOnly) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "isPublic"],
								message: "cannot be both Public and Invite-Only",
							},
							{
								argumentPath: ["input", "isInviteOnly"],
								message: "cannot be both Public and Invite-Only",
							},
						],
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				// Always split for "this and following" updates
				// Step 1: Delete all instances from this one forward (including this instance)

				// First, find all the instances that need to be deleted.
				const instancesToDelete = await tx
					.select({ id: recurringEventInstancesTable.id })
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

				if (instancesToDelete.length > 0) {
					const instanceIdsToDelete = instancesToDelete.map(
						(instance) => instance.id,
					);

					// Delete action items associated with the instances first
					await tx
						.delete(actionItemsTable)
						.where(
							inArray(
								actionItemsTable.recurringEventInstanceId,
								instanceIdsToDelete,
							),
						);

					// Now delete the instances
					await tx
						.delete(recurringEventInstancesTable)
						.where(
							inArray(recurringEventInstancesTable.id, instanceIdsToDelete),
						);
				}

				ctx.log.info(
					{
						baseRecurringEventId: existingInstance.baseRecurringEventId,
						deletedCount: instancesToDelete.length,
						fromStartTime: existingInstance.actualStartTime.toISOString(),
					},
					"Deleted old instances and their action items",
				);

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

				// Calculate timing - if no timing input provided, use template timing to avoid shifts
				const originalDuration =
					existingInstance.actualEndTime.getTime() -
					existingInstance.actualStartTime.getTime();

				// For timing, prefer template timing over instance timing to avoid unintended shifts
				// Only use input timing if explicitly provided and different from template

				const newStartTime = parsedArgs.input.startAt
					? new Date(parsedArgs.input.startAt)
					: existingInstance.actualStartTime;
				const newEndTime = parsedArgs.input.endAt
					? new Date(parsedArgs.input.endAt)
					: new Date(newStartTime.getTime() + originalDuration);

				// Apply calendar-style override logic for recurrence
				const recurrenceInput = applyRecurrenceOverrides(
					parsedArgs.input.startAt,
					originalRecurrence,
					parsedArgs.input.recurrence,
				);

				ctx.log.info(
					{
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
					},
					"Recurrence override applied",
				);

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
						isInviteOnly:
							parsedArgs.input.isInviteOnly ?? originalEvent.isInviteOnly,
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

				ctx.log.info(
					{
						newEventId: createdEvent.id,
						newStartTime: newStartTime.toISOString(),
						newEndTime: newEndTime.toISOString(),
					},
					"Created new base event",
				);

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

				// Set the originalSeriesId to the new recurrence rule's ID
				await tx
					.update(recurrenceRulesTable)
					.set({
						originalSeriesId: createdRecurrenceRule.id,
					})
					.where(eq(recurrenceRulesTable.id, createdRecurrenceRule.id));

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

				ctx.log.info(
					{
						newBaseEventId: createdEvent.id,
						generatedInstancesCount: newInstancesCount,
						windowStart: windowStartDate.toISOString(),
						windowEnd: windowEndDate.toISOString(),
					},
					"Generated new instances",
				);

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
					originalSeriesId: createdRecurrenceRule.id,
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
