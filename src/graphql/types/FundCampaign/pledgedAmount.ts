import { eq, sum } from "drizzle-orm";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
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

				// Selected postgres aggregate not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (fundCampaignPledgedAmount === undefined) {
					ctx.log.error(
						"Postgres aggregate select operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				if (fundCampaignPledgedAmount.amount === null) {
					return 0n;
				}

				return BigInt(fundCampaignPledgedAmount.amount);
			},
			type: "BigInt",
		}),
	}),
});
