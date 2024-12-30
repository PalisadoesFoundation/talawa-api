import type { z } from "zod";
import { venueAttachmentsTableInsertSchema } from "~/src/drizzle/tables/venueAttachments";
import { builder } from "~/src/graphql/builder";
import { VenueAttachmentType } from "~/src/graphql/enums/VenueAttachmentType";

export const createVenueAttachmentInputSchema =
	venueAttachmentsTableInsertSchema.pick({
		uri: true,
		type: true,
	});

export const CreateVenueAttachmentInput = builder
	.inputRef<z.infer<typeof createVenueAttachmentInputSchema>>(
		"VenueAttachmentInput",
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
				type: VenueAttachmentType,
			}),
		}),
	});
