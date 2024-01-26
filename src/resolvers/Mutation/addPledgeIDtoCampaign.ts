import {
  FUND_CAMPAIGN_NOT_FOUND,
  PLEDGE_NOT_FOUND,
  PLEDGE_ID_NOT_NULL,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceCampaignPledge } from "../../models";
import { CampaignPledge, FundCampaign, User } from "../../models";

export const addPledgeIDtoCampaign: MutationResolvers["addPledgeIDtoCampaign"] =
  async (_parent, args, context) => {
    const currentUser = await User.findOne({
      _id: context.userId,
    });

    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const fundCampaign = await FundCampaign.findOne({
      _id: args.data?.fundCampaignId,
    });
    let campaignPledge: InterfaceCampaignPledge | null;

    campaignPledge = await CampaignPledge.findOne({
      _id: args?.data?.pledgeId,
    });

    if (fundCampaign === null) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_CAMPAIGN_NOT_FOUND.MESSAGE),
        FUND_CAMPAIGN_NOT_FOUND.CODE,
        FUND_CAMPAIGN_NOT_FOUND.PARAM
      );
    }

    if (campaignPledge === null) {
      throw new errors.NotFoundError(
        requestContext.translate(PLEDGE_NOT_FOUND.MESSAGE),
        PLEDGE_NOT_FOUND.CODE,
        PLEDGE_NOT_FOUND.PARAM
      );
    }

    const pledgeIdNotNull = await FundCampaign.exists({
      pledgeId: args?.data?.pledgeId,
    });

    if (pledgeIdNotNull) {
      throw new errors.ConflictError(
        requestContext.translate(PLEDGE_ID_NOT_NULL.MESSAGE),
        PLEDGE_ID_NOT_NULL.CODE,
        PLEDGE_ID_NOT_NULL.PARAM
      );
    }

    campaignPledge = await CampaignPledge.findByIdAndUpdate(
      args?.data?.pledgeId,
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
        pledgeId: args?.data?.pledgeId,
      },
      { new: true }
    );

    return newFundCampaign;
  };
