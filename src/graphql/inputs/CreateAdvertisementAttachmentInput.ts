import type { z } from "zod";
import { advertisementAttachmentsTableInsertSchema } from "~/src/drizzle/tables/advertisementAttachments";
import { builder } from "~/src/graphql/builder";
import { AdvertisementAttachmentType } from "~/src/graphql/enums/AdvertisementAttachmentType";

export const createAdvertisementAttachmentInputSchema =
	advertisementAttachmentsTableInsertSchema.pick({
		uri: true,
		type: true,
	});

export const CreateAdvertisementAttachmentInput = builder
	.inputRef<z.infer<typeof createAdvertisementAttachmentInputSchema>>(
		"AdvertisementAttachmentInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			uri: t.string({
				description: "URI to the attachment.",
				required: true,
			}),
			type: t.field({
				description: "Type of the attachment.",
				required: true,
				type: AdvertisementAttachmentType,
			}),
		}),
	});
