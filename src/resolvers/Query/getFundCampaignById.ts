import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { FundCampaign } from "../../models";
import { errors, requestContext } from "../../libraries";
import { FUND_CAMPAIGN_NOT_FOUND } from "../../constants";

/**
 * This query will fetch the donation as a transaction from database.
 * @param _parent -
 * @param args - An object that contains `id` of the fund campaign.
 * @returns A `fundCampaign` object.
 */

export const getFundCampaignById: QueryResolvers["getFundCampaignById"] =
  async (_parent, args) => {
    const fundCampaign = await FundCampaign.findById(args.id).lean();
    if (!fundCampaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_CAMPAIGN_NOT_FOUND.DESC),
        FUND_CAMPAIGN_NOT_FOUND.CODE,
        FUND_CAMPAIGN_NOT_FOUND.MESSAGE
      );
    }
    return await FundCampaign.findById(args.id).lean();
  };
