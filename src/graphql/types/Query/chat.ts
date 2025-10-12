import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryChatInput,
	queryChatInputSchema,
} from "~/src/graphql/inputs/QueryChatInput";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryChatArgumentsSchema = z.object({
	input: queryChatInputSchema,
});

builder.queryField("chat", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryChatInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to read a chat.",
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
			} = queryChatArgumentsSchema.safeParse(args);

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

			const [currentUser, existingChat] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
					with: {
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
				});
			}

			const currentUserOrganizationMembership =
				existingChat.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
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

			return existingChat;
		},
		type: Chat,
	}),
);

builder.queryField("chatsByUser", (t) =>
	t.field({
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to read all chats the current user is a member of.",
		resolve: async (_parent, _args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Check if the current user exists in the database
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					id: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Get all chats where the current user is a member using the chatMemberships relation
			const userChats =
				await ctx.drizzleClient.query.chatMembershipsTable.findMany({
					where: (fields, operators) =>
						operators.eq(fields.memberId, currentUserId),
					with: {
						chat: true,
					},
				});

			// Extract the chat objects from the membership records
			return userChats.map((membership) => membership.chat);
		},
		type: [Chat],
	}),
);
