import type { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachment";
import { builder } from "~/src/graphql/builder";

export type AgendaItemAttachment = typeof agendaItemAttachmentsTable.$inferSelect;

export const AgendaItemAttachment =
    builder.objectRef<AgendaItemAttachment>("AgendaItemAttachment");

AgendaItemAttachment.implement({
    description: "Attachment of the agenda items.",
    fields: (t) => ({
        mimeType: t.exposeString("mimeType", {
            description: "Mime type of the attachment.",
        }),
        objectName: t.exposeString("objectName", {
            description: "Object name used when creating presigned URLs.",
            nullable: true,
        }),
        fileHash: t.exposeString("fileHash", {
            description: "File hash for deduplication purposes.",
            nullable: true,
        }),
        id: t.exposeID("id", {
            description: "Global identifier of the attachment.",
            nullable: false,
        }),
        name: t.exposeString("name", {
            description: "Identifier name of the attachment.",
        }),
    }),
});
