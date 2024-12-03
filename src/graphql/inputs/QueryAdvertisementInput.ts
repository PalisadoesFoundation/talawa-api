import { z } from "zod";
import { advertisementsTableInsertSchema } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";

export const queryAdvertisementInputSchema = z.object({
	id: advertisementsTableInsertSchema.shape.id.unwrap(),
});

export const QueryAdvertisementInput = builder
	.inputRef<z.infer<typeof queryAdvertisementInputSchema>>(
		"QueryAdvertisementInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the advertisement.",
				required: true,
			}),
		}),
	});
