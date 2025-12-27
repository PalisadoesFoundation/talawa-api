import type { z } from "zod";
import { fundCampaignPledgesTableInsertSchema } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";

export const mutationCreateFundCampaignPledgeInputSchema =
	fundCampaignPledgesTableInsertSchema
		.pick({
			amount: true,
			campaignId: true,
			note: true,
			pledgerId: true,
		})
		.refine((data) => data.amount > 0, {
			message: "Amount must be positive",
			path: ["amount"],
		});

export const MutationCreateFundCampaignPledgeInput = builder
	.inputRef<z.infer<typeof mutationCreateFundCampaignPledgeInputSchema>>(
		"MutationCreateFundCampaignPledgeInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			amount: t.field({
				type: "Int",
				description: "The amount of pledged money.",
				required: true,
			}),
			campaignId: t.id({
				description: "Global identifier of the fund campaign.",
				required: true,
			}),
			note: t.string({
				description: "Custom information about the fund campaign pledge.",
			}),
			pledgerId: t.id({
				description: "Global identifier of the user who pledged.",
				required: true,
			}),
		}),
	});
