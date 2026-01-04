import { and, asc, desc, eq, exists, gt, lt, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
	chatMessagesTable,
	chatMessagesTableInsertSchema,
} from "~/src/drizzle/tables/chatMessages";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Chat } from "./Chat";

const messagesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (_error) {
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}

		return {
			cursor,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

const cursorSchema = z.object({
	id: chatMessagesTableInsertSchema.shape.id.unwrap(),
});

Chat.implement({
	fields: (t) => ({
		messages: t.connection(
			{
				description:
					"GraphQL connection to traverse through the messages created within the chat.",
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
				resolve: async (parent, args, ctx) => {
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
					} = messagesArgumentsSchema.safeParse(args);

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

					const currentUser =
						await ctx.drizzleClient.query.usersTable.findFirst({
							with: {
								chatMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.chatId, parent.id),
								},
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.organizationId),
								},
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						});

					if (currentUser === undefined) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthenticated",
							},
						});
					}

					const currentUserOrganizationMembership =
						currentUser.organizationMembershipsWhereMember[0];
					const currentUserChatMembership =
						currentUser.chatMembershipsWhereMember[0];

					if (
						currentUser.role !== "administrator" &&
						(currentUserOrganizationMembership === undefined ||
							(currentUserOrganizationMembership.role !== "administrator" &&
								currentUserChatMembership === undefined))
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(chatMessagesTable.id)]
						: [asc(chatMessagesTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(chatMessagesTable)
										.where(
											and(
												eq(chatMessagesTable.chatId, parent.id),
												eq(chatMessagesTable.id, cursor.id),
											),
										),
								),
								eq(chatMessagesTable.chatId, parent.id),
								lt(chatMessagesTable.id, cursor.id),
							);
						} else {
							where = eq(chatMessagesTable.chatId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(chatMessagesTable)
										.where(
											and(
												eq(chatMessagesTable.chatId, parent.id),
												eq(chatMessagesTable.id, cursor.id),
											),
										),
								),
								eq(chatMessagesTable.chatId, parent.id),
								gt(chatMessagesTable.id, cursor.id),
							);
						} else {
							where = eq(chatMessagesTable.chatId, parent.id);
						}
					}

					const chatMessages =
						await ctx.drizzleClient.query.chatMessagesTable.findMany({
							limit,
							orderBy,
							where,
						});

					if (cursor !== undefined && chatMessages.length === 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [
									{
										argumentPath: [isInversed ? "before" : "after"],
									},
								],
							},
						});
					}

					return transformToDefaultGraphQLConnection({
						createCursor: (message) => ({
							id: message.id,
						}),
						createNode: (message) => message,
						parsedArgs,
						rawNodes: chatMessages,
					});
				},
				type: ChatMessage,
			},
			{
				edgesField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
			{
				nodeField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
		),
	}),
});
