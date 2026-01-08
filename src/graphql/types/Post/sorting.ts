import { asc, desc, eq, inArray } from "drizzle-orm";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import { Post, type Post as PostType } from "~/src/graphql/types/Post/Post";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const GetPostsByOrgInput = builder.inputType("GetPostsByOrgInput", {
	fields: (t) => ({
		organizationId: t.string({ required: true }),
		sortOrder: t.string({ required: false }),
		limit: t.int({ required: false }),
		offset: t.int({ required: false }),
	}),
});

builder.queryField("postsByOrganization", (t) =>
	t.field({
		type: [Post],
		args: {
			input: t.arg({ type: GetPostsByOrgInput, required: true }),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		resolve: async (_parent, { input }, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const { organizationId, sortOrder, limit, offset } = input;

			// Validate limit parameter
			if (limit !== undefined && limit !== null) {
				if (limit < 1) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "limit"],
									message: "Limit must be at least 1.",
								},
							],
						},
					});
				}
				if (limit > 100) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "limit"],
									message: "Limit must not exceed 100.",
								},
							],
						},
					});
				}
			}

			// Validate offset parameter
			if (offset !== undefined && offset !== null && offset < 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "offset"],
								message: "Offset must be non-negative.",
							},
						],
					},
				});
			}

			const orderBy =
				sortOrder === "ASC"
					? asc(postsTable.createdAt)
					: desc(postsTable.createdAt);

			const posts = await ctx.drizzleClient.query.postsTable.findMany({
				where: eq(postsTable.organizationId, organizationId),
				orderBy: [orderBy],
				limit: limit ?? undefined,
				offset: offset ?? undefined,
			});

			const postIds = posts.map((post) => post.id);
			const attachments = postIds.length
				? await ctx.drizzleClient.query.postAttachmentsTable.findMany({
						where: inArray(postAttachmentsTable.postId, postIds),
					})
				: [];

			const attachmentsByPostId = postIds.reduce<
				Record<string, typeof attachments>
			>((acc, postId) => {
				acc[postId] = attachments.filter(
					(attachment) => attachment.postId === postId,
				);
				return acc;
			}, {});

			return posts.map((post) => ({
				...post,
				attachments: attachmentsByPostId[post.id] ?? [],
			})) as unknown as PostType[];
		},
	}),
);
