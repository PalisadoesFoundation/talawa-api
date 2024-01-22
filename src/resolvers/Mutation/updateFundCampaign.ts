import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, FundCampaign, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  FUND_CAMPAIGN_NOT_FOUND,
  START_DATE_VALIDATION_ERROR,
  END_DATE_VALIDATION_ERROR,
} from "../../constants";

export const updateFundCampaign: MutationResolvers["updateFundCampaign"] =
  async (_parent, args, context) => {
    const data = args.data;
    const campaignId = args.id;

    // check if the campaign exists or not
    const getfundCampaign = FundCampaign.findById(campaignId).lean();
    if (!getfundCampaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_CAMPAIGN_NOT_FOUND.DESC),
        FUND_CAMPAIGN_NOT_FOUND.CODE,
        FUND_CAMPAIGN_NOT_FOUND.PARAM
      );
    }

    // check for the startDate and endDate
    const startDate = args.data?.startDate;
    const endDate = args.data?.endDate;
    if (
      startDate &&
      new Date(startDate) <= new Date(new Date().toDateString())
    ) {
      throw new errors.InputValidationError(
        requestContext.translate(START_DATE_VALIDATION_ERROR.MESSAGE),
        START_DATE_VALIDATION_ERROR.CODE,
        START_DATE_VALIDATION_ERROR.PARAM
      );
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new errors.InputValidationError(
        requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
        END_DATE_VALIDATION_ERROR.CODE,
        END_DATE_VALIDATION_ERROR.PARAM
      );
    }

    return await FundCampaign.findOneAndUpdate(
      {
        _id: campaignId,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $set: {
          name: args.data?.name,
          currency: args.data?.currency,
          startDate: args.data?.startDate,
          endDate: args.data?.endDate,
          goalAmount: args.data?.goalAmount,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
