import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { postVotesTable } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdatePostVoteInput,
	mutationUpdatePostVoteInputSchema,
} from "~/src/graphql/inputs/MutationUpdatePostVoteInput";
import { Post } from "~/src/graphql/types/Post/Post";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdatePostVoteArgumentsSchema = z.object({
	input: mutationUpdatePostVoteInputSchema,
});

builder.mutationField("updatePostVote", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdatePostVoteInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to create, update, or delete a post vote. If type is null, the vote will be deleted.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationUpdatePostVoteArgumentsSchema.safeParse(args);

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

			const [currentUser, existingPost, existingVote] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.postsTable.findFirst({
					with: {
						attachmentsWherePost: true,
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.postId),
				}),
				ctx.drizzleClient.query.postVotesTable.findFirst({
					columns: { type: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.creatorId, currentUserId),
							operators.eq(fields.postId, parsedArgs.input.postId),
						),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (!existingPost) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "postId"] }],
					},
				});
			}

			const isAuthorized =
				currentUser.role === "administrator" ||
				existingPost.organization.membershipsWhereOrganization.length > 0;

			if (!isAuthorized) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "postId"] }],
					},
				});
			}

			let voteResult: typeof postVotesTable.$inferSelect | undefined;

			if (parsedArgs.input.type === null) {
				// DELETE the vote if type is null
				if (existingVote) {
					[voteResult] = await ctx.drizzleClient
						.delete(postVotesTable)
						.where(
							and(
								eq(postVotesTable.creatorId, currentUserId),
								eq(postVotesTable.postId, parsedArgs.input.postId),
							),
						)
						.returning();
				} else {
					// If no vote exists and trying to delete, treat as successful no-op
					voteResult = {
						id: "",
						creatorId: currentUserId,
						postId: parsedArgs.input.postId,
						type: "down_vote", // Placeholder value; vote doesn't exist
					} as typeof postVotesTable.$inferSelect;
				}
			} else if (existingVote) {
				// UPDATE the vote if type is not null
				[voteResult] = await ctx.drizzleClient
					.update(postVotesTable)
					.set({ type: parsedArgs.input.type })
					.where(
						and(
							eq(postVotesTable.creatorId, currentUserId),
							eq(postVotesTable.postId, parsedArgs.input.postId),
						),
					)
					.returning();
			} else {
				// CREATE new vote if type is not null
				[voteResult] = await ctx.drizzleClient
					.insert(postVotesTable)
					.values({
						creatorId: currentUserId,
						postId: parsedArgs.input.postId,
						type: parsedArgs.input.type,
					})
					.returning();
			}

			if (!voteResult) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			return Object.assign(existingPost, {
				attachments: existingPost.attachmentsWherePost,
			});
		},
		type: Post,
	}),
);
