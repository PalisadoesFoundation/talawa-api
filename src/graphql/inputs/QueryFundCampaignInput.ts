import { z } from "zod";
import { fundCampaignsTableInsertSchema } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";

export const queryFundCampaignInputSchema = z.object({
	id: fundCampaignsTableInsertSchema.shape.id.unwrap(),
});

export const QueryFundCampaignInput = builder
	.inputRef<z.infer<typeof queryFundCampaignInputSchema>>(
		"QueryFundCampaignInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the fund campaign.",
				required: true,
			}),
		}),
	});
