import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateVenueInputSchema = venuesTableInsertSchema
	.pick({
		capacity: true,
		description: true,
	})
	.extend({
		id: venuesTableInsertSchema.shape.id.unwrap(),
		name: venuesTableInsertSchema.shape.name.optional(),
		attachments: z
			.custom<Promise<FileUpload>>()
			.array()
			.min(1)
			.max(20)
			.optional(),
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
				description: "Attachments of the venue.",
				type: t.listRef("Upload"),
			}),
			description: t.string({
				description: "Custom information about the venue.",
			}),
			id: t.id({
				description: "Global identifier of the venue.",
				required: true,
			}),
			name: t.string({
				description: "Name of the venue.",
			}),
		}),
	});
