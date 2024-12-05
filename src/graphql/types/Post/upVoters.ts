import {
	type SQL,
	and,
	asc,
	desc,
	eq,
	exists,
	gt,
	lt,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import {
	postVotesTable,
	postVotesTableInsertSchema,
} from "~/src/drizzle/tables/postVotes";
import { User } from "~/src/graphql/types/User/User";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { Post } from "./Post";

const upVotersArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
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
	createdAt: postVotesTableInsertSchema.shape.createdAt.unwrap(),
	creatorId: postVotesTableInsertSchema.shape.creatorId.unwrap().unwrap(),
});

Post.implement({
	fields: (t) => ({
		upVoters: t.connection(
			{
				description:
					"GraphQL connection to traverse through the voters that up voted the post.",
				resolve: async (parent, args, ctx) => {
					const {
						data: parsedArgs,
						error,
						success,
					} = upVotersArgumentsSchema.safeParse(args);

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
						? [asc(postVotesTable.createdAt), asc(postVotesTable.creatorId)]
						: [desc(postVotesTable.createdAt), desc(postVotesTable.creatorId)];

					let where: SQL | undefined;

					if (isInversed) {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(postVotesTable)
										.where(
											and(
												eq(postVotesTable.createdAt, cursor.createdAt),
												eq(postVotesTable.creatorId, cursor.creatorId),
												eq(postVotesTable.postId, parent.id),
												eq(postVotesTable.type, "up_vote"),
											),
										),
								),
								eq(postVotesTable.postId, parent.id),
								eq(postVotesTable.type, "up_vote"),
								or(
									and(
										eq(postVotesTable.createdAt, cursor.createdAt),
										gt(postVotesTable.creatorId, cursor.creatorId),
									),
									gt(postVotesTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = and(
								ne(postVotesTable.creatorId, sql`${null}`),
								eq(postVotesTable.postId, parent.id),
								eq(postVotesTable.type, "up_vote"),
							);
						}
					} else {
						if (cursor !== undefined) {
							where = and(
								exists(
									ctx.drizzleClient
										.select()
										.from(postVotesTable)
										.where(
											and(
												eq(postVotesTable.createdAt, cursor.createdAt),
												eq(postVotesTable.creatorId, cursor.creatorId),
												eq(postVotesTable.postId, parent.id),
												eq(postVotesTable.type, "up_vote"),
											),
										),
								),
								eq(postVotesTable.postId, parent.id),
								eq(postVotesTable.type, "up_vote"),
								or(
									and(
										eq(postVotesTable.createdAt, cursor.createdAt),
										lt(postVotesTable.creatorId, cursor.creatorId),
									),
									lt(postVotesTable.createdAt, cursor.createdAt),
								),
							);
						} else {
							where = and(
								ne(postVotesTable.creatorId, sql`${null}`),
								eq(postVotesTable.postId, parent.id),
								eq(postVotesTable.type, "up_vote"),
							);
						}
					}

					const postVotes =
						await ctx.drizzleClient.query.postVotesTable.findMany({
							columns: {
								createdAt: true,
								creatorId: true,
							},
							limit,
							orderBy,
							with: {
								creator: true,
							},
							where,
						});

					if (cursor !== undefined && postVotes.length === 0) {
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
						createCursor: (vote) =>
							Buffer.from(
								JSON.stringify({
									createdAt: vote.createdAt,
									creatorId: vote.creatorId,
								}),
							).toString("base64url"),
						createNode: (vote) => vote.creator,
						parsedArgs,
						rawNodes: postVotes.filter(
							(
								vote,
							): vote is typeof vote & {
								creator: NonNullable<(typeof vote)["creator"]>;
							} => vote.creator !== null,
						),
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
