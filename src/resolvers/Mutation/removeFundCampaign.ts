import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { FundCampaign } from "../../models";
import { FUND_CAMPAIGN_NOT_FOUND } from "../../constants";

export const removeFundCampaign: MutationResolvers["removeFundCampaign"] =
  async (_parent, args, context) => {
    const currentFundCampaign = await FundCampaign.findById(args.id).lean();

    if (!currentFundCampaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_CAMPAIGN_NOT_FOUND.MESSAGE),
        FUND_CAMPAIGN_NOT_FOUND.CODE,
        FUND_CAMPAIGN_NOT_FOUND.PARAM
      );
    }

    return await FundCampaign.findOneAndDelete({
      _id: args.id,
    }).lean();
  };
