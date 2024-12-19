import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateChatMembershipInput,
	mutationUpdateChatMembershipInputSchema,
} from "~/src/graphql/inputs/MutationUpdateChatMembershipInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateChatMembershipArgumentsSchema = z.object({
	input: mutationUpdateChatMembershipInputSchema,
});

builder.mutationField("updateChatMembership", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateChatMembershipInput,
			}),
		},
		description: "Mutation field to update a chat membership.",
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
			} = mutationUpdateChatMembershipArgumentsSchema.safeParse(args);

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

			const [currentUser, existingChat, existingMember] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
					with: {
						chatMembershipsWhereChat: {
							columns: {
								memberId: true,
								role: true,
							},
							where: (fields, operators) =>
								operators.inArray(fields.memberId, [
									currentUserId,
									parsedArgs.input.memberId,
								]),
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
						operators.eq(fields.id, parsedArgs.input.chatId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.memberId),
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

			if (existingChat === undefined && existingMember === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "chatId"],
							},
							{
								argumentPath: ["input", "memberId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (existingChat === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "chatId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (existingMember === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			const [currentUserChatMembership, existingChatMembership] = [
				currentUserId,
				parsedArgs.input.memberId,
			].map((id) =>
				existingChat.chatMembershipsWhereChat.find(
					(membership) => membership.memberId === id,
				),
			);

			if (existingChatMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
							{
								argumentPath: ["input", "chatId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingChat.organization.organizationMembershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						(currentUserChatMembership === undefined ||
							(currentUserChatMembership.role !== "administrator" &&
								currentUserId !== parsedArgs.input.memberId))))
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "memberId"],
							},
							{
								argumentPath: ["input", "chatId"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [updatedChatMembership] = await ctx.drizzleClient
				.update(chatMembershipsTable)
				.set({
					role: parsedArgs.input.role,
					updaterId: currentUserId,
				})
				.where(
					and(
						eq(chatMembershipsTable.chatId, parsedArgs.input.chatId),
						eq(chatMembershipsTable.memberId, parsedArgs.input.memberId),
					),
				)
				.returning();

			// Updated chat membership not being returned means that either it was deleted or its `member_id` column or `chat_id` column or both were changed by external entities before this update operation could take place.
			if (updatedChatMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return existingChat;
		},
		type: Chat,
	}),
);
