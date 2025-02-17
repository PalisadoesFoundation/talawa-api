import { eq } from "drizzle-orm";
import { z } from "zod";
import { commentsTable } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteCommentInput,
	mutationDeleteCommentInputSchema,
} from "~/src/graphql/inputs/MutationDeleteCommentInput";
import { Comment } from "~/src/graphql/types/Comment/Comment";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";

const mutationDeleteCommentArgumentsSchema = z.object({
	input: mutationDeleteCommentInputSchema,
});

export async function deleteCommentResolver(
	_parent: unknown,
	args: z.infer<typeof mutationDeleteCommentArgumentsSchema>,
	ctx: GraphQLContext,
) {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const {
		success,
		data: parsedArgs,
		error,
	} = mutationDeleteCommentArgumentsSchema.safeParse(args);

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
			columns: { role: true },
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		}),
		ctx.drizzleClient.query.commentsTable.findFirst({
			columns: {
				creatorId: true,
			},
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
		});
	}

	const currentUserOrganizationMembership =
		existingComment.post.organization.membershipsWhereOrganization[0];

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			(currentUserOrganizationMembership.role !== "administrator" &&
				existingComment.creatorId !== currentUserId))
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action_on_arguments_associated_resources",
				issues: [{ argumentPath: ["input", "id"] }],
			},
		});
	}

	const [deletedComment] = await ctx.drizzleClient
		.delete(commentsTable)
		.where(eq(commentsTable.id, parsedArgs.input.id))
		.returning();

	if (deletedComment === undefined) {
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	return deletedComment;
}

builder.mutationField("deleteComment", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteCommentInput,
			}),
		},
		description: "Mutation field to delete a comment.",
		resolve: deleteCommentResolver,
		type: Comment,
	}),
);
