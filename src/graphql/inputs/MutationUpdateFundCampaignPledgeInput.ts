import type { z } from "zod";
import { fundCampaignPledgesTableInsertSchema } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateFundCampaignPledgeInputSchema =
	fundCampaignPledgesTableInsertSchema
		.pick({
			note: true,
		})
		.extend({
			amount: fundCampaignPledgesTableInsertSchema.shape.amount.optional(),
			id: fundCampaignPledgesTableInsertSchema.shape.id.unwrap(),
		})
		.refine(
			({ id, ...remainingArg }) =>
				Object.values(remainingArg).some((value) => value !== undefined),
			{
				message: "At least one optional argument must be provided.",
			},
		);

export const MutationUpdateFundCampaignPledgeInput = builder
	.inputRef<z.infer<typeof mutationUpdateFundCampaignPledgeInputSchema>>(
		"MutationUpdateFundCampaignPledgeInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			amount: t.int({
				description: "The amount of pledged money.",
			}),
			id: t.id({
				description:
					"Global identifier of the associated fund campaign pledge.",
				required: true,
			}),
			note: t.string({
				description: "Custom information about the fund campaign pledge.",
			}),
		}),
	});
