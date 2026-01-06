import { z } from "zod";
import { commentsTable } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateCommentInput,
	mutationCreateCommentInputSchema,
} from "~/src/graphql/inputs/MutationCreateCommentInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { firstOrThrow } from "~/src/lib/dbHelpers";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a comment.",
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.postId),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (!existingPost) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "postId"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingPost.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				!currentUserOrganizationMembership
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
				});
			}

			const rows = await ctx.drizzleClient
				.insert(commentsTable)
				.values({
					body: parsedArgs.input.body,
					creatorId: currentUserId,
					postId: parsedArgs.input.postId,
				})
				.returning();

			const createdComment = firstOrThrow(
				rows,
				"Comment creation failed",
				"unexpected",
			);

			return createdComment;
		},
		type: Comment,
	}),
);
