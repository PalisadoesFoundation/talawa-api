import { eq } from "drizzle-orm";
import { z } from "zod";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeletePostInput,
	mutationDeletePostInputSchema,
} from "~/src/graphql/inputs/MutationDeletePostInput";
import { Post } from "~/src/graphql/types/Post/Post";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeletePostArgumentsSchema = z.object({
	input: mutationDeletePostInputSchema,
});

builder.mutationField("deletePost", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeletePostInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete a post.",
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
			} = mutationDeletePostArgumentsSchema.safeParse(args);

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
						creatorId: true,
					},
					with: {
						attachmentsWherePost: true,
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

			if (existingPost === undefined) {
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

			if (currentUser.role !== "administrator") {
				const currentUserOrganizationMembership =
					existingPost.organization.membershipsWhereOrganization[0];

				if (
					currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						existingPost.creatorId !== currentUserId)
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
					});
				}
			}

			const deletedPost = await ctx.drizzleClient.transaction(async (tx) => {
				const [deletedPostResult] = await tx
					.delete(postsTable)
					.where(eq(postsTable.id, parsedArgs.input.id))
					.returning();

				// Deleted post not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation.
				if (deletedPostResult === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				await ctx.minio.client.removeObjects(
					ctx.minio.bucketName,
					existingPost.attachmentsWherePost
						.map((attachment) => attachment.objectName)
						.filter((name): name is string => name !== null),
				);

				return Object.assign(deletedPostResult, {
					attachments: existingPost.attachmentsWherePost,
				});
			});

			// Invalidate post caches (graceful degradation - don't break mutation on cache errors)
			try {
				await invalidateEntity(ctx.cache, "post", parsedArgs.input.id);
				await invalidateEntityLists(ctx.cache, "post");
			} catch (error) {
				ctx.log.warn(
					{ error: error instanceof Error ? error.message : "Unknown error" },
					"Failed to invalidate post cache (non-fatal)",
				);
			}

			return deletedPost;
		},
		type: Post,
	}),
);
