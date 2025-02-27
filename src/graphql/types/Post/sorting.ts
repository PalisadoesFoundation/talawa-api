import { asc, desc, eq, inArray } from "drizzle-orm";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import { Post, type Post as PostType } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const GetPostsByOrgInput = builder.inputType("GetPostsByOrgInput", {
	fields: (t) => ({
		organizationId: t.string({ required: true }),
		sortOrder: t.string({ required: false }),
	}),
});

builder.queryField("postsByOrganization", (t) =>
	t.field({
		type: [Post],
		args: {
			input: t.arg({ type: GetPostsByOrgInput, required: true }),
		},
		resolve: async (_parent, { input }, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const { organizationId, sortOrder } = input;

			const orderBy =
				sortOrder === "ASC"
					? asc(postsTable.createdAt)
					: desc(postsTable.createdAt);

			const posts = await ctx.drizzleClient.query.postsTable.findMany({
				where: eq(postsTable.organizationId, organizationId),
				orderBy: [orderBy],
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
