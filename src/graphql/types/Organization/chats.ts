import { type SQL, and, asc, desc, eq, exists, gt, lt, or } from "drizzle-orm";
import type { z } from "zod";
import { chatsTable, chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

const chatsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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

const cursorSchema = chatsTableInsertSchema
	.pick({
		name: true,
	})
	.extend({
		id: chatsTableInsertSchema.shape.id.unwrap(),
	});

Organization.implement({
	fields: (t) => ({
		chats: t.connection(
			{
				description:
					"GraphQL connection to traverse through the chats belonging to the organization.",
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
					} = chatsArgumentsSchema.safeParse(args);

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
							columns: {
								role: true,
							},
							with: {
								organizationMembershipsWhereMember: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.organizationId, parent.id),
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

					if (
						currentUser.role !== "administrator" &&
						currentUserOrganizationMembership === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_action",
							},
						});
					}

					const { cursor, isInversed, limit } = parsedArgs;

					const orderBy = isInversed
						? [desc(chatsTable.name), desc(chatsTable.id)]
						: [asc(chatsTable.name), asc(chatsTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(chatsTable)
										.where(
											and(
												eq(chatsTable.id, cursor.id),
												eq(chatsTable.name, cursor.name),
												eq(chatsTable.organizationId, parent.id),
											),
										),
								),
								eq(chatsTable.organizationId, parent.id),
								or(
									and(
										eq(chatsTable.name, cursor.name),
										lt(chatsTable.id, cursor.id),
									),
									lt(chatsTable.name, cursor.name),
								),
							);
						} else {
							where = eq(chatsTable.organizationId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(chatsTable)
										.where(
											and(
												eq(chatsTable.id, cursor.id),
												eq(chatsTable.name, cursor.name),
												eq(chatsTable.organizationId, parent.id),
											),
										),
								),
								eq(chatsTable.organizationId, parent.id),
								or(
									and(
										eq(chatsTable.name, cursor.name),
										gt(chatsTable.id, cursor.id),
									),
									gt(chatsTable.name, cursor.name),
								),
							);
						} else {
							where = eq(chatsTable.organizationId, parent.id);
						}
					}

					const chats = await ctx.drizzleClient.query.chatsTable.findMany({
						limit,
						orderBy,
						where,
					});

					if (cursor !== undefined && chats.length === 0) {
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
						createCursor: (chat) =>
							Buffer.from(
								JSON.stringify({
									id: chat.id,
									name: chat.name,
								}),
							).toString("base64url"),
						createNode: (chat) => chat,
						parsedArgs,
						rawNodes: chats,
					});
				},
				type: Chat,
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
