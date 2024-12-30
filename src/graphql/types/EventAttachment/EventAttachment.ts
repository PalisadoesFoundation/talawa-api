import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { builder } from "~/src/graphql/builder";
import { EventAttachmentType } from "~/src/graphql/enums/EventAttachmentType";

export type EventAttachment = typeof eventAttachmentsTable.$inferSelect;

export const EventAttachment =
	builder.objectRef<EventAttachment>("EventAttachment");

EventAttachment.implement({
	description: "",
	fields: (t) => ({
		type: t.expose("type", {
			description: "Type of the attachment.",
			type: EventAttachmentType,
		}),
		uri: t.exposeString("uri", {
			description: "URI to the attachment.",
		}),
	}),
});
