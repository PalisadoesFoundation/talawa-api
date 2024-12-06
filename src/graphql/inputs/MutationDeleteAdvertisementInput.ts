import { z } from "zod";
import { advertisementsTableInsertSchema } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteAdvertisementInputSchema = z.object({
	id: advertisementsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteAdvertisementInput = builder
	.inputRef<z.infer<typeof mutationDeleteAdvertisementInputSchema>>(
		"MutationDeleteAdvertisementInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the advertisement.",
				required: true,
			}),
		}),
	});
