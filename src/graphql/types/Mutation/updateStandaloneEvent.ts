import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateEventInput,
	mutationUpdateEventInputSchema,
} from "~/src/graphql/inputs/MutationUpdateEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";

const mutationUpdateStandaloneEventArgumentsSchema = z.object({
	input: mutationUpdateEventInputSchema,
});

builder.mutationField("updateStandaloneEvent", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for updating a standalone event.",
				required: true,
				type: MutationUpdateEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a standalone (non-recurring) event.",
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
			} = mutationUpdateStandaloneEventArgumentsSchema.safeParse(args);

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
						endAt: true,
						organizationId: true,
						startAt: true,
						allDay: true,
						isPublic: true,
						isRegisterable: true,
						location: true,
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

			if (
				isNotNullish(parsedArgs.input.endAt) &&
				!isNotNullish(parsedArgs.input.startAt) &&
				parsedArgs.input.endAt <= existingEvent.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "endAt"],
								message: `Must be greater than the value: ${existingEvent.startAt.toISOString()}.`,
							},
						],
					},
				});
			}

			if (
				!isNotNullish(parsedArgs.input.endAt) &&
				isNotNullish(parsedArgs.input.startAt) &&
				parsedArgs.input.startAt >= existingEvent.endAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "startAt"],
								message: `Must be smaller than the value: ${existingEvent.endAt.toISOString()}.`,
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

			const [updatedEvent] = await ctx.drizzleClient
				.update(eventsTable)
				.set({
					description: parsedArgs.input.description,
					endAt: parsedArgs.input.endAt,
					name: parsedArgs.input.name,
					startAt: parsedArgs.input.startAt,
					allDay: parsedArgs.input.allDay,
					isPublic: parsedArgs.input.isPublic,
					isRegisterable: parsedArgs.input.isRegisterable,
					location: parsedArgs.input.location,
					updaterId: currentUserId,
				})
				.where(eq(eventsTable.id, parsedArgs.input.id))
				.returning();

			// Updated event not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedEvent === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return Object.assign(updatedEvent, {
				attachments: existingEvent.attachmentsWhereEvent,
			});
		},
		type: Event,
	}),
);
