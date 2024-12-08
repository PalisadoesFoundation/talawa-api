import { z } from "zod";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";

export const queryFundInputSchema = z.object({
	id: fundsTableInsertSchema.shape.id.unwrap(),
});

export const QueryFundInput = builder
	.inputRef<z.infer<typeof queryFundInputSchema>>("QueryFundInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the fund.",
				required: true,
			}),
		}),
	});
