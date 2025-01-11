import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import { z } from "zod";
import {
	chatMembershipsTable,
	chatMembershipsTableInsertSchema,
} from "~/src/drizzle/tables/chatMemberships";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Chat } from "./Chat";

const membersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = chatMembershipsTableInsertSchema
	.pick({
		memberId: true,
	})
	.extend({
		createdAt: z.string().datetime(),
	})
	.transform((arg) => ({
		createdAt: new Date(arg.createdAt),
		memberId: arg.memberId,
	}));

Chat.implement({
	fields: (t) => ({
		members: t.connection(
			{
				description:
					"GraphQL connection to traverse through the users that are members of the chat.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = membersArgumentsSchema.safeParse(args);

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

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [
								asc(chatMembershipsTable.createdAt),
								asc(chatMembershipsTable.memberId),
							]
						: [
								desc(chatMembershipsTable.createdAt),
								desc(chatMembershipsTable.memberId),
							];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(chatMembershipsTable)
										.where(
											and(
												eq(chatMembershipsTable.memberId, cursor.memberId),
												eq(chatMembershipsTable.chatId, parent.id),
											),
										),
								),
								eq(chatMembershipsTable.chatId, parent.id),
								or(
									and(
										eq(chatMembershipsTable.createdAt, cursor.createdAt),
										gt(chatMembershipsTable.memberId, cursor.memberId),
									),
									gt(chatMembershipsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(chatMembershipsTable.chatId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(chatMembershipsTable)
										.where(
											and(
												eq(chatMembershipsTable.memberId, cursor.memberId),
												eq(chatMembershipsTable.chatId, parent.id),
											),
										),
								),
								eq(chatMembershipsTable.chatId, parent.id),
								or(
									and(
										eq(chatMembershipsTable.createdAt, cursor.createdAt),
										lt(chatMembershipsTable.memberId, cursor.memberId),
									),
									lt(chatMembershipsTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = eq(chatMembershipsTable.chatId, parent.id);
						}
					}

					const chatMemberships =
						await ctx.drizzleClient.query.chatMembershipsTable.findMany({
							columns: {
								createdAt: true,
								memberId: true,
							},
							limit,
							orderBy,
							with: {
								member: true,
							},
							where,
						});

					if (cursor !== undefined && chatMemberships.length === 0) {
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
						createCursor: (chatMembership) =>
							Buffer.from(
								JSON.stringify({
									createdAt: chatMembership.createdAt.toISOString(),
									memberId: chatMembership.memberId,
								}),
							).toString("base64url"),
						createNode: (chatMembership) => chatMembership.member,
						parsedArgs,
						rawNodes: chatMemberships,
					});
				},
				type: User,
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
