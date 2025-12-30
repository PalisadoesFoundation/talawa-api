import { eq, sum } from "drizzle-orm";
import { fundCampaignPledgesTable } from "~/src/drizzle/tables/fundCampaignPledges";
import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { FundCampaign as FundCampaignType } from "./FundCampaign";
import { FundCampaign } from "./FundCampaign";

/**
 * Resolves the total pledged amount for a fund campaign.
 * @param parent - The parent FundCampaign object.
 * @param _args - Arguments (unused).
 * @param ctx - The GraphQL context.
 * @returns - The total pledged amount as a BigInt.
 */
export const resolvePledgedAmount = async (
	parent: FundCampaignType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<bigint> => {
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
};

FundCampaign.implement({
	fields: (t) => ({
		pledgedAmount: t.field({
			description: "Total amount of money pledged under the fund campaign.",
			complexity: envConfig.API_GRAPHQL_SCALAR_FIELD_COST,
			resolve: resolvePledgedAmount,
			type: "BigInt",
		}),
	}),
});
