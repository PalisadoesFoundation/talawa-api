import { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { FundCampaignPledge } from "./FundCampaignPledge";

FundCampaignPledge.implement({
	fields: (t) => ({
		campaign: t.field({
			description:
				"Fund campaign which the fund campaign pledge is associated to.",
			resolve: async (parent, _args, ctx) => {
				const existingFundCampaign =
					await ctx.drizzleClient.query.fundCampaignsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.campaignId),
					});

				// Fund campaign id existing but the associated fund campaign not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingFundCampaign === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a fund campaign pledge's campaign id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingFundCampaign;
			},
			type: FundCampaign,
		}),
	}),
});
