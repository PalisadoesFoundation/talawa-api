import type { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import { builder } from "~/src/graphql/builder";
import { AdvertisementAttachmentType } from "~/src/graphql/enums/AdvertisementAttachmentType";

export type AdvertisementAttachment =
	typeof advertisementAttachmentsTable.$inferSelect;

export const AdvertisementAttachment =
	builder.objectRef<AdvertisementAttachment>("AdvertisementAttachment");

AdvertisementAttachment.implement({
	description: "",
	fields: (t) => ({
		type: t.expose("type", {
			description: "Type of the attachment.",
			type: AdvertisementAttachmentType,
		}),
		uri: t.exposeString("uri", {
			description: "URI to the attachment.",
		}),
	}),
});
