import type { z } from "zod";
import type { commentVoteTypeZodEnum } from "~/src/drizzle/enums/commentVoteType";
import { builder } from "~/src/graphql/builder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { CommentVoteType } from "../../enums/CommentVoteType";
import { Comment } from "./Comment";

export const HasUserVotedComment = builder.objectRef<{
	hasVoted: boolean;
	voteType: z.infer<typeof commentVoteTypeZodEnum> | null;
}>("HasUserVotedComment");

HasUserVotedComment.implement({
	fields: (t) => ({
		hasVoted: t.field({
			type: "Boolean",
			nullable: false,
			description: "Indicates if the user has voted on this comment",
			resolve: (parent) => parent.hasVoted,
		}),
		voteType: t.expose("voteType", {
			type: CommentVoteType,
			nullable: true,
			description: "Type of the comment vote, null if no vote exists",
		}),
	}),
});

// Add the hasUserVoted field to the Comment type
Comment.implement({
	fields: (t) => ({
		hasUserVoted: t.field({
			args: {
				userId: t.arg.id({
					description:
						"The ID of the user to check if they have voted on this comment.",
					required: true,
				}),
			},
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			description:
				"Check if a specific user has voted on this comment and return vote details.",
			resolve: async (parent, args, ctx) => {
				const currentUserId = ctx.currentClient.user?.id;
				if (!currentUserId) return { hasVoted: false, voteType: null };

				// Authorization: Allow access if args.userId === currentUser.id OR currentUser has org-level permission
				// First get the comment to find its postId, then get the post to find its organizationId
				const comment = await ctx.drizzleClient.query.commentsTable.findFirst({
					columns: {
						postId: true,
					},
					where: (fields, operators) => operators.eq(fields.id, parent.id),
				});

				if (!comment?.postId) return { hasVoted: false, voteType: null };

				const post = await ctx.drizzleClient.query.postsTable.findFirst({
					columns: {
						organizationId: true,
					},
					where: (fields, operators) => operators.eq(fields.id, comment.postId),
				});

				if (!post?.organizationId) return { hasVoted: false, voteType: null };

				// Now get the current user with their organization membership for this post's organization
				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					with: {
						organizationMembershipsWhereMember: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.organizationId, post.organizationId),
						},
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				const currentUserOrganizationMembership =
					currentUser?.organizationMembershipsWhereMember[0];

				// Deny access unless args.userId === currentUser.id OR currentUser has org-level permission
				if (
					args.userId !== currentUserId &&
					currentUser?.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						currentUserOrganizationMembership.role !== "administrator")
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				const existingCommentVote =
					await ctx.drizzleClient.query.commentVotesTable.findFirst({
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.commentId, parent.id),
								operators.eq(fields.creatorId, args.userId),
							),
					});

				if (existingCommentVote === undefined) {
					return {
						voteType: null,
						hasVoted: false,
					};
				}

				return {
					voteType: existingCommentVote.type as z.infer<
						typeof commentVoteTypeZodEnum
					>,
					hasVoted: true,
				};
			},
			type: HasUserVotedComment,
		}),
	}),
});
