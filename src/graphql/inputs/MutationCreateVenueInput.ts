import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";

export const mutationCreateVenueInputSchema = venuesTableInsertSchema
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
	});

export const MutationCreateVenueInput = builder
	.inputRef<z.infer<typeof mutationCreateVenueInputSchema>>(
		"MutationCreateVenueInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			attachments: t.field({
				description: "Attachments of the venue.",
				type: t.listRef("Upload"),
			}),
			description: t.string({
				description: "Custom information about the venue.",
			}),
			name: t.string({
				description: "Name of the venue.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
		}),
	});
