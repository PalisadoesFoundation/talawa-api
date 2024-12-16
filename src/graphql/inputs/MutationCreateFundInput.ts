import type { z } from "zod";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import { builder } from "~/src/graphql/builder";

export const mutationCreateFundInputSchema = fundsTableInsertSchema.pick({
	isTaxDeductible: true,
	name: true,
	organizationId: true,
});

export const MutationCreateFundInput = builder
	.inputRef<z.infer<typeof mutationCreateFundInputSchema>>(
		"MutationCreateFundInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			isTaxDeductible: t.boolean({
				description: "Boolean to tell if the fund is tax deductible.",
				required: true,
			}),
			name: t.string({
				description: "Name of the fund.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
		}),
	});
