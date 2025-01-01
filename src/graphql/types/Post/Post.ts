import type { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	PostAttachment,
	type PostAttachment as PostAttachmentType,
} from "~/src/graphql/types/PostAttachment/PostAttachment";

export type Post = typeof postsTable.$inferSelect & {
	attachments: PostAttachmentType[] | null;
};

export const Post = builder.objectRef<Post>("Post");

Post.implement({
	description:
		"Posts are a feature for members of organizations to share text and media within the organization.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description: "Array of attachments.",
			type: t.listRef(PostAttachment),
		}),
		caption: t.exposeString("caption", {
			description: "Caption for the post.",
		}),
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the post was created.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the post.",
			nullable: false,
		}),
		pinnedAt: t.expose("pinnedAt", {
			description: "Date time at the time the post was pinned.",
			type: "DateTime",
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Date time at the time the post was last updated.",
			type: "DateTime",
		}),
	}),
});
