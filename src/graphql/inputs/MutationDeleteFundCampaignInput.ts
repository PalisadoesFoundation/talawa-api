import { z } from "zod";
import { fundCampaignsTableInsertSchema } from "~/src/drizzle/tables/fundCampaigns";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteFundCampaignInputSchema = z.object({
	id: fundCampaignsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteFundCampaignInput = builder
	.inputRef<z.infer<typeof mutationDeleteFundCampaignInputSchema>>(
		"MutationDeleteFundCampaignInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the fund campaign.",
				required: true,
			}),
		}),
	});
