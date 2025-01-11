import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCommentVoteInput,
	mutationUpdateCommentVoteInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCommentVoteInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
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
		description: "Mutation field to update a comment vote.",
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

			const [currentUser, existingComment] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.commentsTable.findFirst({
					with: {
						post: {
							columns: {
								pinnedAt: true,
							},
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
						},
						votesWhereComment: {
							columns: {
								type: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.creatorId, currentUserId),
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.commentId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingComment === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "commentId"],
							},
						],
					},
				});
			}

			const existingCommentVote = existingComment.votesWhereComment[0];

			if (existingCommentVote === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "commentId"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingComment.post.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "commentId"],
							},
						],
					},
				});
			}

			const [updatedCommentVote] = await ctx.drizzleClient
				.update(commentVotesTable)
				.set({
					type: parsedArgs.input.type,
				})
				.where(
					and(
						eq(commentVotesTable.commentId, parsedArgs.input.commentId),
						eq(commentVotesTable.creatorId, currentUserId),
					),
				)
				.returning();

			// Updated comment vote not being returned means that either it was deleted or its `commentId` or `voterId` columns were changed by external entities before this delete operation could take place.
			if (updatedCommentVote === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return existingComment;
		},
		type: Comment,
	}),
);
