import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCommentVoteInput,
	mutationUpdateCommentVoteInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCommentVoteInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
					message: "Only authenticated users can perform this action.",
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
					message: "Invalid arguments provided.",
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingComment, existingCommentVote] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.commentsTable.findFirst({
						with: {
							post: {
								columns: {},
								with: {
									organization: {
										columns: {},
										with: {
											organizationMembershipsWhereOrganization: {
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
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.commentId),
					}),
					ctx.drizzleClient.query.commentVotesTable.findFirst({
						columns: {},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.commentId, parsedArgs.input.commentId),
								operators.eq(fields.creatorId, currentUserId),
							),
					}),
				]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			if (existingComment === undefined || existingCommentVote === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "commentId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingComment.post.organization
					.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [updatedCommentVote] = await ctx.drizzleClient
				.update(commentVotesTable)
				.set({
					type: parsedArgs.input.type,
					updaterId: currentUserId,
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
					message: "Something went wrong. Please try again.",
				});
			}

			return existingComment;
		},
		type: Comment,
	}),
);
