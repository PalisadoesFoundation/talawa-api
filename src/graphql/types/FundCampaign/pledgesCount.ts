import { count, eq } from "drizzle-orm";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { FundCampaign } from "./FundCampaign";

FundCampaign.implement({
	fields: (t) => ({
		pledgesCount: t.field({
			description: "Total number of pledges associated to the fund campaign.",
			resolve: async (parent, _args, ctx) => {
				const [fundCampaignPledgesCount] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(fundCampaignPledgesTable)
					.where(eq(fundCampaignPledgesTable.campaignId, parent.id));

				// Selected postgres aggregate not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (fundCampaignPledgesCount === undefined) {
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

				return fundCampaignPledgesCount.count;
			},
			type: "Int",
		}),
	}),
});
