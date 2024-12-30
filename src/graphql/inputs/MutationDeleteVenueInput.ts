import { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteVenueInputSchema = z.object({
	id: venuesTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteVenueInput = builder
	.inputRef<z.infer<typeof mutationDeleteVenueInputSchema>>(
		"MutationDeleteVenueInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the venue.",
				required: true,
			}),
		}),
	});
