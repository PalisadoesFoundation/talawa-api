import type { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateVenueInputSchema = venuesTableInsertSchema
	.pick({
		description: true,
	})
	.extend({
		id: venuesTableInsertSchema.shape.id.unwrap(),
		name: venuesTableInsertSchema.shape.name.optional(),
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
