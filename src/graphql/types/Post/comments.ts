import { type SQL, and, asc, desc, eq, exists, gt, lt } from "drizzle-orm";
import { z } from "zod";
import {
	commentsTable,
	commentsTableInsertSchema,
} from "~/src/drizzle/tables/comments";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Post } from "./Post";

const commentsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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
	id: commentsTableInsertSchema.shape.id.unwrap(),
});

Post.implement({
	fields: (t) => ({
		comments: t.connection(
			{
				description:
					"GraphQL connection to traverse through the comments created under the post.",
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
					} = commentsArgumentsSchema.safeParse(args);

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
						? [desc(commentsTable.id)]
						: [asc(commentsTable.id)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(commentsTable)
										.where(
											and(
												eq(commentsTable.id, cursor.id),
												eq(commentsTable.postId, parent.id),
											),
										),
								),
								eq(commentsTable.postId, parent.id),
								lt(commentsTable.id, cursor.id),
							);
						} else {
							where = eq(commentsTable.postId, parent.id);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(commentsTable)
										.where(
											and(
												eq(commentsTable.id, cursor.id),
												eq(commentsTable.postId, parent.id),
											),
										),
								),
								eq(commentsTable.postId, parent.id),
								gt(commentsTable.id, cursor.id),
							);
						} else {
							where = eq(commentsTable.postId, parent.id);
						}
					}

					const comments = await ctx.drizzleClient.query.commentsTable.findMany(
						{
							limit,
							orderBy,
							where,
						},
					);

					if (cursor !== undefined && comments.length === 0) {
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
						createCursor: (comment) =>
							Buffer.from(
								JSON.stringify({
									id: comment.id,
								}),
							).toString("base64url"),
						createNode: (comment) => comment,
						parsedArgs,
						rawNodes: comments,
					});
				},
				type: Comment,
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
