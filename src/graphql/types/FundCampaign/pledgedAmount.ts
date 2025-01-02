import { eq, sum } from "drizzle-orm";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { FundCampaign } from "./FundCampaign";

FundCampaign.implement({
	fields: (t) => ({
		pledgedAmount: t.field({
			description: "Total amount of money pledged under the fund campaign.",
			resolve: async (parent, _args, ctx) => {
				const [fundCampaignPledgedAmount] = await ctx.drizzleClient
					.select({
						amount: sum(fundCampaignPledgesTable.amount),
					})
					.from(fundCampaignPledgesTable)
					.where(eq(fundCampaignPledgesTable.campaignId, parent.id));

				if (fundCampaignPledgedAmount.amount === null) {
					return 0n;
				}

				return BigInt(fundCampaignPledgedAmount.amount);
			},
			type: "BigInt",
		}),
	}),
});
