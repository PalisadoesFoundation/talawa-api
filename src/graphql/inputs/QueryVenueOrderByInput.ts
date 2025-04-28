import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const QueryVenueOrderByInputSchema = z.object({
	field: z.enum(["name", "capacity"]).nullable(),
	direction: z.enum(["ASC", "DESC"]).nullable(),
});

export const QueryVenueOrderByInput = builder
	.inputRef<z.infer<typeof QueryVenueOrderByInputSchema>>(
    "QueryVenueOrderByInput",
	)
	.implement({
		description: "Input for ordering venues.",
		fields: (t) => ({
			field: t.field({
				type: builder.enumType("VenueOrderByField", {
					values: ["name", "capacity"],
				}),
				required: false,
			}),
			direction: t.field({
				type: builder.enumType("OrderDirection", {
					values: ["ASC", "DESC"],
				}),
				required: false,
			}),
		}),
	});
