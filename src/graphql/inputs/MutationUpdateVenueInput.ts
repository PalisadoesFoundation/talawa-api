import { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";
import {
	FileMetadataInput,
	fileMetadataInputSchema,
} from "./FileMetadataInput";

export const mutationUpdateVenueInputSchema = venuesTableInsertSchema
	.pick({
		capacity: true,
	})
	.extend({
		description: sanitizedStringSchema.min(1).max(2048).optional(),
		id: venuesTableInsertSchema.shape.id.unwrap(),
		name: sanitizedStringSchema.min(1).max(256).optional(),
		attachments: z.array(fileMetadataInputSchema).min(1).max(20).optional(),
	})

	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateVenueInput = builder
	.inputRef<z.infer<typeof mutationUpdateVenueInputSchema>>(
		"MutationUpdateVenueInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			capacity: t.int({
				description: "Capacity of the venue.",
			}),
			attachments: t.field({
				description:
					"File metadata for attachments uploaded via MinIO presigned URLs.",
				required: false,
				type: [FileMetadataInput],
			}),
			description: t.string({
				description: "Custom information about the venue.",
				required: false,
			}),
			id: t.id({
				description: "Global identifier of the venue.",
				required: true,
			}),
			name: t.string({
				description: "Name of the venue.",
				required: false,
			}),
		}),
	});
