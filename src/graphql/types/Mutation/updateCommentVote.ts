import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCommentVoteInput,
	mutationUpdateCommentVoteInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCommentVoteInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateCommentVoteArgumentsSchema = z.object({
	input: mutationUpdateCommentVoteInputSchema,
});

builder.mutationField("updateCommentVote", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateCommentVoteInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to create, update, or delete a comment vote. If type is null, the vote will be deleted.",
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
			} = mutationUpdateCommentVoteArgumentsSchema.safeParse(args);

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

			const [currentUser, existingComment, existingVote] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.commentsTable.findFirst({
					with: {
						post: {
							columns: { pinnedAt: true },
							with: {
								organization: {
									columns: { countryCode: true },
									with: {
										membershipsWhereOrganization: {
											columns: { role: true },
											where: (fields, operators) =>
												operators.eq(fields.memberId, currentUserId),
										},
									},
								},
							},
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.commentId),
				}),
				ctx.drizzleClient.query.commentVotesTable.findFirst({
					columns: { type: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.creatorId, currentUserId),
							operators.eq(fields.commentId, parsedArgs.input.commentId),
						),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (!existingComment) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "commentId"] }],
					},
				});
			}

			const isAuthorized =
				currentUser.role === "administrator" ||
				existingComment.post.organization.membershipsWhereOrganization.length >
					0;

			if (!isAuthorized) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "commentId"] }],
					},
				});
			}

			let voteResult: typeof commentVotesTable.$inferSelect | undefined;

			if (parsedArgs.input.type === null) {
				// DELETE the vote if type is null
				if (existingVote) {
					[voteResult] = await ctx.drizzleClient
						.delete(commentVotesTable)
						.where(
							and(
								eq(commentVotesTable.creatorId, currentUserId),
								eq(commentVotesTable.commentId, parsedArgs.input.commentId),
							),
						)
						.returning();
				} else {
					// If no vote exists and trying to delete, treat as successful no-op
					voteResult = {
						id: "",
						creatorId: currentUserId,
						commentId: parsedArgs.input.commentId,
						type: "down_vote", // Placeholder value; vote doesn't exist
					} as typeof commentVotesTable.$inferSelect;
				}
			} else if (existingVote) {
				// UPDATE the vote if type is not null
				[voteResult] = await ctx.drizzleClient
					.update(commentVotesTable)
					.set({ type: parsedArgs.input.type })
					.where(
						and(
							eq(commentVotesTable.creatorId, currentUserId),
							eq(commentVotesTable.commentId, parsedArgs.input.commentId),
						),
					)
					.returning();
			} else {
				// CREATE new vote if type is not null
				[voteResult] = await ctx.drizzleClient
					.insert(commentVotesTable)
					.values({
						creatorId: currentUserId,
						commentId: parsedArgs.input.commentId,
						type: parsedArgs.input.type,
					})
					.returning();
			}

			if (!voteResult) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			return existingComment;
		},
		type: Comment,
	}),
);
