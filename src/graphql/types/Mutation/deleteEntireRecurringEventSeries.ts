import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
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

			const [currentUser, existingEvent] = await Promise.all([
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

			return await ctx.drizzleClient.transaction(async (tx) => {
				// Delete the template (this will cascade delete all instances via foreign key constraints)
				const [deletedEvent] = await tx
					.delete(eventsTable)
					.where(eq(eventsTable.id, parsedArgs.input.id))
					.returning();

				if (deletedEvent === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Clean up attachments
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
		},
		type: Event,
	}),
);
