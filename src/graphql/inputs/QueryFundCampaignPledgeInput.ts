import { z } from "zod";
import { fundCampaignPledgesTableInsertSchema } from "~/src/drizzle/tables/fundCampaignPledges";
import { builder } from "~/src/graphql/builder";

export const queryFundCampaignPledgeInputSchema = z.object({
	id: fundCampaignPledgesTableInsertSchema.shape.id.unwrap(),
});

export const QueryFundCampaignPledgeInput = builder
	.inputRef<z.infer<typeof queryFundCampaignPledgeInputSchema>>(
		"QueryFundCampaignPledgeInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the fund campaign pledge.",
				required: true,
			}),
		}),
	});
