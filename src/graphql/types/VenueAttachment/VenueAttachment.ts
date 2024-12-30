import type { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { builder } from "~/src/graphql/builder";
import { VenueAttachmentType } from "~/src/graphql/enums/VenueAttachmentType";

export type VenueAttachment = typeof venueAttachmentsTable.$inferSelect;

export const VenueAttachment =
	builder.objectRef<VenueAttachment>("VenueAttachment");

VenueAttachment.implement({
	description: "",
	fields: (t) => ({
		type: t.expose("type", {
			description: "Type of the attachment.",
			type: VenueAttachmentType,
		}),
		uri: t.exposeString("uri", {
			description: "URI to the attachment.",
		}),
	}),
});
