import type { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { builder } from "~/src/graphql/builder";

export type VenueAttachment = typeof venueAttachmentsTable.$inferSelect;

export const VenueAttachment =
	builder.objectRef<VenueAttachment>("VenueAttachment");

VenueAttachment.implement({
	description: "Attachment of the venue.",
	fields: (t) => ({
		mimeType: t.exposeString("mimeType", {
			description: "Mime type of the attachment.",
		}),
	}),
});
