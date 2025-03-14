import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
export const mutationUpdateVenueInputSchema = venuesTableInsertSchema
	.pick({
		description: true,
		name: true,
		organizationId: true,
	})
	.extend({
		attachments: z
			.custom<Promise<FileUpload>>()
			.array()
			.min(1)
			.max(20)
			.optional(),
		id: venuesTableInsertSchema.shape.id.unwrap(),
		name: venuesTableInsertSchema.shape.name.optional(),
		capacity: venuesTableInsertSchema.shape.capacity,
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
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
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
				required: true,
			}),
			capacity: t.int({
				description: "Capacity of a venue.",
				required: true,
			}),
		}),
	});
