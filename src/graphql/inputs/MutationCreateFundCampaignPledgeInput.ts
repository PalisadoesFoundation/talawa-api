import type { z } from "zod";
import { fundCampaignPledgesTableInsertSchema } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";
import { Iso4217CurrencyCode } from "~/src/graphql/enums/Iso4217CurrencyCode";

export const mutationCreateFundCampaignPledgeInputSchema =
	fundCampaignPledgesTableInsertSchema.pick({
		currencyCode: true,
		amount: true,
		campaignId: true,
		note: true,
		pledgerId: true,
	});

export const MutationCreateFundCampaignPledgeInput = builder
	.inputRef<z.infer<typeof mutationCreateFundCampaignPledgeInputSchema>>(
		"MutationCreateFundCampaignPledgeInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			amount: t.int({
				description: "The amount of pledged money.",
				required: true,
			}),
			campaignId: t.id({
				description: "Global identifier of the fund campaign.",
				required: true,
			}),
			currencyCode: t.field({
				description: "Currency code of the fund campaign pledge.",
				required: true,
				type: Iso4217CurrencyCode,
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
