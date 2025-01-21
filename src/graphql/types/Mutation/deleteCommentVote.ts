import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteCommentVoteInput,
	mutationDeleteCommentVoteInputSchema,
} from "~/src/graphql/inputs/MutationDeleteCommentVoteInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteCommentVoteArgumentsSchema = z.object({
	input: mutationDeleteCommentVoteInputSchema,
});

builder.mutationField("deleteCommentVote", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteCommentVoteInput,
			}),
		},
		description: "Mutation field to delete a comment vote.",
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
			} = mutationDeleteCommentVoteArgumentsSchema.safeParse(args);

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

			const [currentUser, existingComment, existingCreator] = await Promise.all(
				[
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
					ctx.drizzleClient.query.usersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
				],
			);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingComment === undefined && existingCreator === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "commentId"],
							},
							{
								argumentPath: ["input", "creatorId"],
							},
						],
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

			if (existingCreator === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "creatorId"],
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
							{
								argumentPath: ["input", "creatorId"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingComment.post.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						parsedArgs.input.creatorId !== currentUserId))
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "commentId"],
							},
							{
								argumentPath: ["input", "creatorId"],
							},
						],
					},
				});
			}

			const [deletedCommentVote] = await ctx.drizzleClient
				.delete(commentVotesTable)
				.where(
					and(
						eq(commentVotesTable.commentId, parsedArgs.input.commentId),
						eq(commentVotesTable.creatorId, parsedArgs.input.creatorId),
					),
				)
				.returning();

			// Deleted comment vote not being returned means that either it was deleted or its `commentId` or `creatorId` columns were changed by external entities before this delete operation could take place.
			if (deletedCommentVote === undefined) {
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
