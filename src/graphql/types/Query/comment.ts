import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryCommentInput,
	queryCommentInputSchema,
} from "~/src/graphql/inputs/QueryCommentInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const queryCommentArgumentsSchema = z.object({
	input: queryCommentInputSchema,
});

builder.queryField("comment", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryCommentInput,
			}),
		},
		description: "Query field to read a comment.",
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
			} = queryCommentArgumentsSchema.safeParse(args);

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
						operators.eq(fields.id, parsedArgs.input.id),
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

			if (existingComment === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
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
								argumentPath: ["input", "id"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			return existingComment;
		},
		type: Comment,
	}),
);
