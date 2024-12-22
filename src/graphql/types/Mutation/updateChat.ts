import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateChatInput,
	mutationUpdateChatInputSchema,
} from "~/src/graphql/inputs/MutationUpdateChatInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateChatArgumentsSchema = z.object({
	input: mutationUpdateChatInputSchema,
});

builder.mutationField("updateChat", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateChatInput,
			}),
		},
		description: "Mutation field to update a chat.",
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
			} = mutationUpdateChatArgumentsSchema.safeParse(args);

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

			const [currentUser, existingChat] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
					columns: {},
					with: {
						chatMembershipsWhereChat: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
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

			if (existingChat === undefined) {
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

			const currentUserOrganizationMembership =
				existingChat.organization.organizationMembershipsWhereOrganization[0];
			const currentUserChatMembership =
				existingChat.chatMembershipsWhereChat[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						(currentUserChatMembership === undefined ||
							currentUserChatMembership.role !== "administrator")))
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

			const [updatedChat] = await ctx.drizzleClient
				.update(chatsTable)
				.set({
					avatarURI: parsedArgs.input.avatarURI,
					description: parsedArgs.input.description,
					name: parsedArgs.input.name,
					updaterId: currentUserId,
				})
				.where(eq(chatsTable.id, parsedArgs.input.id))
				.returning();

			// Updated chat not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedChat === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return updatedChat;
		},
		type: Chat,
	}),
);
