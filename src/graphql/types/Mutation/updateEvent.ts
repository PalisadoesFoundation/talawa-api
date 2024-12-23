import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateEventInput,
	mutationUpdateEventInputSchema,
} from "~/src/graphql/inputs/MutationUpdateEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateEventArgumentsSchema = z.object({
	input: mutationUpdateEventInputSchema,
});

builder.mutationField("updateEvent", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateEventInput,
			}),
		},
		description: "Mutation field to update an event.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationUpdateEventArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
					message: "Invalid arguments provided.",
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
					},
					with: {
						eventAttachmentsWhereEvent: true,
						organization: {
							columns: {},
							with: {
								organizationMembershipsWhereOrganization: {
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [updatedEvent] = await ctx.drizzleClient
				.update(eventsTable)
				.set({
					description: parsedArgs.input.description,
					endAt: parsedArgs.input.endAt,
					name: parsedArgs.input.name,
					startAt: parsedArgs.input.startAt,
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
					message: "Something went wrong. Please try again.",
				});
			}

			return Object.assign(updatedEvent, {
				attachments: existingEvent.eventAttachmentsWhereEvent,
			});
		},
		type: Event,
	}),
);
