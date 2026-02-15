import { eq } from "drizzle-orm";
import { z } from "zod";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteStandaloneEventInput,
	mutationDeleteStandaloneEventInputSchema,
} from "~/src/graphql/inputs/MutationDeleteStandaloneEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching/invalidation";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteStandaloneEventArgumentsSchema = z.object({
	input: mutationDeleteStandaloneEventInputSchema,
});

builder.mutationField("deleteStandaloneEvent", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for deleting a standalone event.",
				required: true,
				type: MutationDeleteStandaloneEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete a standalone (non-recurring) event.",
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
			} = mutationDeleteStandaloneEventArgumentsSchema.safeParse(args);

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

			const [currentUser, existingEvent] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {
						startAt: true,
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

			// Validate this is a standalone event (not recurring)
			if (existingEvent.isRecurringEventTemplate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"Event is not a standalone event. Use specific mutations for recurring events: deleteEntireRecurringEventSeries, deleteSingleEventInstance, or deleteThisAndFollowingEvents.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization[0];

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

			const result = await ctx.drizzleClient.transaction(async (tx) => {
				// First, delete any action items associated with the event
				await tx
					.delete(actionItemsTable)
					.where(eq(actionItemsTable.eventId, parsedArgs.input.id));

				const [deletedEvent] = await tx
					.delete(eventsTable)
					.where(eq(eventsTable.id, parsedArgs.input.id))
					.returning();

				// Deleted event not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
				if (deletedEvent === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				await ctx.minio.client.removeObjects(
					ctx.minio.bucketName,
					existingEvent.attachmentsWhereEvent.map(
						(attachment) => attachment.name,
					),
				);

				return Object.assign(deletedEvent, {
					attachments: existingEvent.attachmentsWhereEvent,
				});
			});

			try {
				await Promise.allSettled([
					invalidateEntity(ctx.cache, "event", parsedArgs.input.id),
					invalidateEntityLists(ctx.cache, "event"),
				]);
			} catch (cacheError) {
				ctx.log.error(
					{ cacheError, entity: "event" },
					"Cache invalidation failed",
				);
			}

			return result;
		},
		type: Event,
	}),
);
