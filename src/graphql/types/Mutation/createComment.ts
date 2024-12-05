import { z } from "zod";
import { commentsTable } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateCommentInput,
	mutationCreateCommentInputSchema,
} from "~/src/graphql/inputs/MutationCreateCommentInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateCommentArgumentsSchema = z.object({
	input: mutationCreateCommentInputSchema,
});

builder.mutationField("createComment", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateCommentInput,
			}),
		},
		description: "Mutation field to create a comment.",
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
			} = mutationCreateCommentArgumentsSchema.safeParse(args);

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

			const [currentUser, existingPost] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.postsTable.findFirst({
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.postId),
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

			if (existingPost === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "postId"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingPost.organization.organizationMembershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "postId"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [createdComment] = await ctx.drizzleClient
				.insert(commentsTable)
				.values({
					body: parsedArgs.input.body,
					creatorId: currentUserId,
					postId: parsedArgs.input.postId,
				})
				.returning();

			// Inserted comment not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdComment === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return createdComment;
		},
		type: Comment,
	}),
);
