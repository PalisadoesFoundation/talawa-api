import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import { z } from "zod";
import {
	chatMessagesTable,
	chatMessagesTableInsertSchema,
} from "~/src/drizzle/tables/chatMessages";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { Chat } from "./Chat";

const messagesArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined = undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (error) {
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
					"GraphQL connection to traverse through the chat messages that are associated to the chat.",
				resolve: async (parent, args, ctx) => {
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
							message: "Invalid arguments provided.",
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
							message:
								"No associated resources found for the provided arguments.",
						});
					}

					return transformToDefaultGraphQLConnection({
						createCursor: (message) =>
							Buffer.from(
								JSON.stringify({
									id: message.id,
								}),
							).toString("base64url"),
						createNode: (message) => message,
						parsedArgs,
						rawNodes: chatMessages,
					});
				},
				type: ChatMessage,
			},
			{
				description: "",
			},
			{
				description: "",
			},
		),
	}),
});
