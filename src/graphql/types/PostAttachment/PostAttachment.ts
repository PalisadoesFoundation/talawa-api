import type { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { builder } from "~/src/graphql/builder";

export type PostAttachment = typeof postAttachmentsTable.$inferSelect;

export const PostAttachment =
	builder.objectRef<PostAttachment>("PostAttachment");

PostAttachment.implement({
	description: "Attachment of the post.",
	fields: (t) => ({
		mimeType: t.exposeString("mimeType", {
			description: "Mime type of the attachment.",
		}),
	}),
});
