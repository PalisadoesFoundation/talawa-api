import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, FundCampaign, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  FUND_CAMPAIGN_NOT_FOUND,
  USER_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  END_DATE_VALIDATION_ERROR,
} from "../../constants";

export const updateFundCampaign: MutationResolvers["updateFundCampaign"] =
  async (_parent, args, context) => {
    const data = args.data;
    const campaignId = args.id;

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

    return await Advertisement.findOneAndUpdate( {
      _id: campaignId,
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(data as any),
    },
    {
      new: true,
    }).lean();
  };
