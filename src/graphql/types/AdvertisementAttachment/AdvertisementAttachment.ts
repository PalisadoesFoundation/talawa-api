import type { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import { builder } from "~/src/graphql/builder";

export type AdvertisementAttachment =
	typeof advertisementAttachmentsTable.$inferSelect;

export const AdvertisementAttachment =
	builder.objectRef<AdvertisementAttachment>("AdvertisementAttachment");

AdvertisementAttachment.implement({
	description: "Attachment of the advertisement.",
	fields: (t) => ({
		mimeType: t.exposeString("mimeType", {
			description: "Mime type of the attachment.",
		}),
	}),
});
