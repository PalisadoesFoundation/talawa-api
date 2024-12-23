import type { z } from "zod";
import { eventAttachmentsTableInsertSchema } from "~/src/drizzle/tables/eventAttachments";
import { builder } from "~/src/graphql/builder";
import { EventAttachmentType } from "~/src/graphql/enums/EventAttachmentType";

export const createEventAttachmentInputSchema =
	eventAttachmentsTableInsertSchema.pick({
		uri: true,
		type: true,
	});

export const CreateEventAttachmentInput = builder
	.inputRef<z.infer<typeof createEventAttachmentInputSchema>>(
		"EventAttachmentInput",
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
				type: EventAttachmentType,
			}),
		}),
	});
