import { type SQL, and, desc, eq, ilike, isNull } from "drizzle-orm";
import { postsTable } from "~/src/drizzle/tables/posts";
import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";
import {
	organizationPostsArgumentsSchema,
	PostWhereInput,
} from "~/src/graphql/inputs/QueryOrganizationPostInput";

interface PostWithAttachments {
	id: string;
	caption: string;
	createdAt: Date;
	updatedAt: Date | null;
	updaterId: string | null;
	creatorId: string;
	organizationId: string;
	pinnedAt: Date | null;
	attachmentsWherePost: Array<{
		id: string;
		postId: string;
		creatorId: string;
		mimeType: string;
		name: string;
		objectName: string;
		fileHash: string;
		createdAt: Date;
		updatedAt: Date | null;
		updaterId: string | null;
	}>;
	creator: {
		id: string;
		name: string;
		profileImage: string | null;
	};
}

Organization.implement({
	fields: (t) => ({
		Orgposts: t.field({
			type: [Post],
			description: "Posts for this organization",
			args: {
				skip: t.arg.int({ description: "Number of items to skip" }),
				first: t.arg.int({ description: "Number of items to return" }),
				where: t.arg({
					type: PostWhereInput,
					description: "Filter criteria for posts",
				}),
			},
			resolve: async (parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const {
					success,
					error,
					data: parsedArgs,
				} = organizationPostsArgumentsSchema.safeParse(args);

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

				const [currentUser, currentUserOrganizationMembership] =
					await Promise.all([
						ctx.drizzleClient.query.usersTable.findFirst({
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.id, currentUserId),
						}),
						ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.and(
									operators.eq(fields.organizationId, parent.id),
									operators.eq(fields.memberId, currentUserId),
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

				if (
					currentUser.role !== "administrator" &&
					currentUserOrganizationMembership === undefined
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							message:
								"You must be an organization member or system admin to view organization posts.",
							issues: [{ argumentPath: [] }],
						},
					});
				}

				const { skip, first, where } = parsedArgs;

				let query: SQL<unknown> = eq(postsTable.organizationId, parent.id);

				if (where) {
					if (where.caption_contains) {
						query = and(
							query,
							ilike(postsTable.caption, `%${where.caption_contains}%`),
						) as SQL<unknown>;
					}

					if (where.creatorId) {
						query = and(
							query,
							eq(postsTable.creatorId, where.creatorId),
						) as SQL<unknown>;
					}

					if (where.isPinned !== undefined) {
						if (where.isPinned) {
							query = and(query, isNull(postsTable.pinnedAt)) as SQL<unknown>;
						} else {
							query = and(query, isNull(postsTable.pinnedAt)) as SQL<unknown>;
						}
					}
				}

				const posts = await ctx.drizzleClient.query.postsTable.findMany({
					where: query,
					limit: first,
					offset: skip,
					orderBy: (fields) => [desc(fields.pinnedAt), desc(fields.createdAt)],
					with: {
						creator: {
							columns: {
								id: true,
								name: true,
							},
						},
						attachmentsWherePost: true,
					},
				});

				return posts.map((postFromDb) => {
					return Object.assign(postFromDb, {
						attachments: (
							postFromDb as PostWithAttachments
						).attachmentsWherePost.map((attachment) => ({
							...attachment,
							mimeType: attachment.mimeType as
								| "image/avif"
								| "image/jpeg"
								| "image/png"
								| "image/webp"
								| "video/mp4"
								| "video/webm",
							creatorId: attachment.creatorId || null,
						})),
					});
				});
			},
		}),
	}),
});
