import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { builder } from "~/src/graphql/builder";

export type EventAttachment = typeof eventAttachmentsTable.$inferSelect;

export const EventAttachment =
	builder.objectRef<EventAttachment>("EventAttachment");

EventAttachment.implement({
	description: "Attachment of the event.",
	fields: (t) => ({
		mimeType: t.exposeString("mimeType", {
			description: "Mime type of the attachment.",
		}),
	}),
});
