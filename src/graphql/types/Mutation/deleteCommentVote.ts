import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteCommentVoteInput,
	mutationDeleteCommentVoteInputSchema,
} from "~/src/graphql/inputs/MutationDeleteCommentVoteInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
					message: "Only authenticated users can perform this action.",
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
					message: "Invalid arguments provided.",
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [
				currentUser,
				existingComment,
				existingCreator,
				existingCommentVote,
			] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
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
				ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.commentVotesTable.findFirst({
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
					message: "No associated resources found for the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingComment.post.organization
					.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
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
					message: "Something went wrong. Please try again.",
				});
			}

			return existingComment;
		},
		type: Comment,
	}),
);
