import { z } from "zod";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";

const uuidV7Regex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const queryFundInputSchema = z.object({
	id: fundsTableInsertSchema.shape.id.unwrap().regex(uuidV7Regex, {
		message: "Fund ID must be a valid UUID v7.",
	}),
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
