import { z } from "zod";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateFundInputSchema = z
	.object({
		isTaxDeductible: fundsTableInsertSchema.shape.isTaxDeductible.optional(),
		id: fundsTableInsertSchema.shape.id.unwrap(),
		name: fundsTableInsertSchema.shape.name.optional(),
	})
	.refine(
		({ id, ...arg }) => Object.values(arg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateFundInput = builder
	.inputRef<z.infer<typeof mutationUpdateFundInputSchema>>(
		"MutationUpdateFundInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			isTaxDeductible: t.boolean({
				description: "Boolean to tell if the fund is tax deductible.",
			}),
			name: t.string({
				description: "Name of the fund.",
			}),
		}),
	});
