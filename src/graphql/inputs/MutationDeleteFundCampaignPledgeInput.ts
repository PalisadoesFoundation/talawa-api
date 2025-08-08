import { z } from "zod";
import { fundCampaignPledgesTableInsertSchema } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteFundCampaignPledgeInputSchema = z.object({
	id: fundCampaignPledgesTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteFundCampaignPledgeInput = builder
	.inputRef<z.infer<typeof mutationDeleteFundCampaignPledgeInputSchema>>(
		"MutationDeleteFundCampaignPledgeInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the fund campaign pledge.",
				required: true,
			}),
		}),
	});
