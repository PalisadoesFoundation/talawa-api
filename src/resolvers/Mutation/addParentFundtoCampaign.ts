import {
  FUND_CAMPAIGN_NOT_FOUND,
  PARENT_FUND_NOT_NULL,
  FUND_NOT_FOUND,
} from "../../constants";

import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceFund } from "../../models";
import { Fund, FundCampaign } from "../../models";

export const addParentFundtoCampaign: MutationResolvers["addParentFundtoCampaign"] =
  async (_parent, args) => {
    const fundCampaign = await FundCampaign.findOne({
      _id: args.data?.fundCampaignId,
    });
    let fund: InterfaceFund | null;

    fund = await Fund.findOne({
      _id: args?.data?.parentFundId,
    });

    if (fundCampaign === null) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_CAMPAIGN_NOT_FOUND.MESSAGE),
        FUND_CAMPAIGN_NOT_FOUND.CODE,
        FUND_CAMPAIGN_NOT_FOUND.PARAM
      );
    }

    if (fund === null) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_NOT_FOUND.MESSAGE),
        FUND_NOT_FOUND.CODE,
        FUND_NOT_FOUND.PARAM
      );
    }

    const parentFundIdNotNull = await FundCampaign.exists({
      parentFundId: args?.data?.parentFundId,
    });

    if (parentFundIdNotNull) {
      throw new errors.ConflictError(
        requestContext.translate(PARENT_FUND_NOT_NULL.MESSAGE),
        PARENT_FUND_NOT_NULL.CODE,
        PARENT_FUND_NOT_NULL.PARAM
      );
    }

    fund = await Fund.findByIdAndUpdate(
      args?.data?.parentFundId,
      {
        $push: {
          campaigns: args?.data?.fundCampaignId,
        },
      },
      { new: true }
    );

    const newFundCampaign = await FundCampaign.findOneAndUpdate(
      { _id: args?.data?.fundCampaignId },
      {
        pledgeId: args?.data?.parentFundId,
      },
      { new: true }
    );

    return newFundCampaign;
  };
