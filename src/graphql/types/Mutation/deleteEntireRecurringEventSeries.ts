import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteEntireRecurringEventSeriesInput,
	mutationDeleteEntireRecurringEventSeriesInputSchema,
} from "~/src/graphql/inputs/MutationDeleteEntireRecurringEventSeriesInput";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteEntireRecurringEventSeriesArgumentsSchema = z.object({
	input: mutationDeleteEntireRecurringEventSeriesInputSchema,
});

builder.mutationField("deleteEntireRecurringEventSeries", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for deleting entire recurring event series.",
				required: true,
				type: MutationDeleteEntireRecurringEventSeriesInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to delete an entire recurring event series (template and all instances).",
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
			} = mutationDeleteEntireRecurringEventSeriesArgumentsSchema.safeParse(
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

			const [currentUser, existingEvent, recurrenceRule] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {
						id: true,
						isRecurringEventTemplate: true,
						creatorId: true,
					},
					with: {
						attachmentsWhereEvent: true,
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
				}),
				ctx.drizzleClient.query.recurrenceRulesTable.findFirst({
					columns: {
						originalSeriesId: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.baseRecurringEventId, parsedArgs.input.id),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingEvent === undefined) {
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

			if (recurrenceRule === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
					message:
						"No recurrence rule found for this recurring event template.",
				});
			}

			// Validate this is a recurring event template
			if (!existingEvent.isRecurringEventTemplate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"Event is not a recurring event template. Use deleteEvent for standalone events or other delete mutations for instances.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization[0];

			// Authorization check
			if (
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator") &&
				existingEvent.creatorId !== currentUserId
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
				// Use the originalSeriesId from the recurrence rule we fetched
				const originalSeriesId = recurrenceRule.originalSeriesId;

				// Handle case where originalSeriesId is null
				if (originalSeriesId === null) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "id"],
									message: "Recurrence rule missing original series ID.",
								},
							],
						},
					});
				}

				// Find all templates that belong to the same logical series
				const allTemplatesInSeries = await tx
					.select({
						id: eventsTable.id,
						attachments: eventsTable.id, // We'll use this to fetch attachments later
					})
					.from(eventsTable)
					.innerJoin(
						recurrenceRulesTable,
						eq(eventsTable.id, recurrenceRulesTable.baseRecurringEventId),
					)
					.where(eq(recurrenceRulesTable.originalSeriesId, originalSeriesId));

				// Get all instances that belong to this logical series for exception cleanup
				const allInstancesInSeries = await tx
					.select({ id: recurringEventInstancesTable.id })
					.from(recurringEventInstancesTable)
					.where(
						eq(recurringEventInstancesTable.originalSeriesId, originalSeriesId),
					);

				const templateIds = allTemplatesInSeries.map((template) => template.id);
				const instanceIds = allInstancesInSeries.map((instance) => instance.id);

				// First, delete all action items associated with the series
				// This includes items linked to the base templates and individual instances
				if (templateIds.length > 0) {
					await tx
						.delete(actionItemsTable)
						.where(inArray(actionItemsTable.eventId, templateIds));
				}
				if (instanceIds.length > 0) {
					await tx
						.delete(actionItemsTable)
						.where(
							inArray(actionItemsTable.recurringEventInstanceId, instanceIds),
						);
				}

				// Delete exceptions for all instances in the series
				if (instanceIds.length > 0) {
					await tx
						.delete(eventExceptionsTable)
						.where(
							inArray(
								eventExceptionsTable.recurringEventInstanceId,
								instanceIds,
							),
						);
				}

				// Delete all instances in the series
				if (instanceIds.length > 0) {
					await tx
						.delete(recurringEventInstancesTable)
						.where(
							eq(
								recurringEventInstancesTable.originalSeriesId,
								originalSeriesId,
							),
						);
				}

				// Delete all recurrence rules in the series
				await tx
					.delete(recurrenceRulesTable)
					.where(eq(recurrenceRulesTable.originalSeriesId, originalSeriesId));

				// Finally, delete all templates in the series
				const [deletedEvent] = await tx
					.delete(eventsTable)
					.where(inArray(eventsTable.id, templateIds))
					.returning();

				if (deletedEvent === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Clean up attachments for the original template
				// Note: We only clean up attachments for the original template that was requested
				// Other templates in the series may have their own attachments managed separately
				await ctx.minio.client.removeObjects(
					ctx.minio.bucketName,
					existingEvent.attachmentsWhereEvent.map(
						(attachment: { name: string }) => attachment.name,
					),
				);

				return Object.assign(deletedEvent, {
					attachments: existingEvent.attachmentsWhereEvent,
				});
			});
		},
		type: Event,
	}),
);
