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
    // Add these fields:
    objectName: t.exposeString("objectName", {
      description: "Object name used when creating presigned URLs.",
      nullable: true,
    }),
    fileHash: t.exposeString("fileHash", {
      description: "File hash for deduplication purposes.",
      nullable: true,
    }),
    name: t.exposeString("name", {
      description: "Identifier name of the attachment.",
    }),
    // Any other fields you want to expose...
  }),
});