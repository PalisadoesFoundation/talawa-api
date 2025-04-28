import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const QueryVenueWhereInputSchema = z.object({
	name_contains: z.string().optional(),
	name_starts_with: z.string().optional(),
	description_starts_with: z.string().optional(),
	description_contains: z.string().optional(),
});

export const QueryVenueWhereInput = builder
	.inputRef<z.infer<typeof QueryVenueWhereInputSchema>>("QueryVenueWhereInput")
	.implement({
		description: "Filters to apply when querying venues.",
		fields: (t) => ({
			name_contains: t.string({
				required: false,
				description: "Filter venues where name contains this value.",
			}),
			name_starts_with: t.string({
				required: false,
				description: "Filter venues where name starts with this value.",
			}),
			description_starts_with: t.string({
				required: false,
				description: "Filter venues where description starts with this value.",
			}),
			description_contains: t.string({
				required: false,
				description: "Filter venues where description contains this value.",
			}),
		}),
	});
