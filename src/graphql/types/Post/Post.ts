import type { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	PostAttachment,
	type PostAttachment as PostAttachmentType,
} from "~/src/graphql/types/PostAttachment/PostAttachment";
import { escapeHTML } from "~/src/utilities/sanitizer";

export type Post = Omit<typeof postsTable.$inferSelect, "creatorId"> & {
	attachments: PostAttachmentType[] | null;
	creatorId: string | null;
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
		caption: t.string({
			description: "Caption for the post.",
			resolve: (root) => escapeHTML(root.caption),
		}),
		body: t.string({
			description: "Body for the post.",
			nullable: true,
			resolve: (root) => (root.body ? escapeHTML(root.body) : null),
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
