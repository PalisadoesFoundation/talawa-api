import { z } from "zod";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteFundInputSchema = z.object({
	id: fundsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteFundInput = builder
	.inputRef<z.infer<typeof mutationDeleteFundInputSchema>>(
		"MutationDeleteFundInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the fund.",
				required: true,
			}),
		}),
	});
