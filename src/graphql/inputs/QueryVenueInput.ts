import { z } from "zod";
import { venuesTableInsertSchema } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";

export const queryVenueInputSchema = z.object({
	id: venuesTableInsertSchema.shape.id.unwrap(),
});

export const QueryVenueInput = builder
	.inputRef<z.infer<typeof queryVenueInputSchema>>("QueryVenueInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the venue.",
				required: true,
			}),
		}),
	});
