import { z } from "zod";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateCommentVoteInput,
	mutationCreateCommentVoteInputSchema,
} from "~/src/graphql/inputs/MutationCreateCommentVoteInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateCommentVoteArgumentsSchema = z.object({
	input: mutationCreateCommentVoteInputSchema,
});

builder.mutationField("createCommentVote", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateCommentVoteInput,
			}),
		},
		description: "Mutation field to create a comment vote.",
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
			} = mutationCreateCommentVoteArgumentsSchema.safeParse(args);

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
								columns: {
									pinnedAt: true,
								},
								with: {
									organization: {
										columns: {
											countryCode: true,
										},
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

			if (existingCommentVote !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "commentId"],
								message: "This comment is already voted.",
							},
						],
					},
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
				});
			}

			const [createdCommentVote] = await ctx.drizzleClient
				.insert(commentVotesTable)
				.values({
					creatorId: currentUserId,
					commentId: parsedArgs.input.commentId,
					type: parsedArgs.input.type,
				})
				.returning();

			// Inserted comment vote not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdCommentVote === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);
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
