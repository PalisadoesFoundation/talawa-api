import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateChatMessageInput,
	mutationUpdateChatMessageInputSchema,
} from "~/src/graphql/inputs/MutationUpdateChatMessageInput";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateChatMessageArgumentsSchema = z.object({
	input: mutationUpdateChatMessageInputSchema,
});

builder.mutationField("updateChatMessage", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateChatMessageInput,
			}),
		},
		description: "Mutation field to update a chat message.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = mutationUpdateChatMessageArgumentsSchema.safeParse(args);

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

			const [currentUser, existingChatMessage] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatMessagesTable.findFirst({
					columns: {
						creatorId: true,
					},
					with: {
						chat: {
							columns: {
								avatarMimeType: true,
							},
							with: {
								chatMembershipsWhereChat: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
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

			if (existingChatMessage === undefined) {
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

			const currentUserOrganizationMembership =
				existingChatMessage.chat.organization.membershipsWhereOrganization[0];
			const currentUserChatMembership =
				existingChatMessage.chat.chatMembershipsWhereChat[0];

			if (
				(currentUser.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						(currentUserOrganizationMembership.role !== "administrator" &&
							currentUserChatMembership === undefined))) ||
				currentUserId !== existingChatMessage.creatorId
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

			const [updatedChatMessage] = await ctx.drizzleClient
				.update(chatMessagesTable)
				.set({
					body: parsedArgs.input.body,
				})
				.where(eq(chatMessagesTable.id, parsedArgs.input.id))
				.returning();

			// Updated chat message not being returned means that either it was updated or its `id` column was changed by external entities before this update operation could take place.
			if (updatedChatMessage === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedChatMessage;
		},
		type: ChatMessage,
	}),
);
