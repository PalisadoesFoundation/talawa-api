import {
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { FundraisingCampaign, User } from "../../models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import { type MutationResolvers } from "../../types/generatedGraphQLTypes";
import { validateDate } from "../../utilities/dateValidator";
/**
 * This function enables to create a fundraisingCampaiginPledge .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2 .If the startDate is valid
 * 3. If the endDate is valid
 * 4. if the fund campaign exists
 * @returns Created fundraisingCampaignPledge
 */
export const createFundraisingCampaignPledge: MutationResolvers["createFundraisingCampaignPledge"] =
  async (
    _parent,
    args,
    context,
  ): Promise<InterfaceFundraisingCampaignPledges> => {
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const campaign = await FundraisingCampaign.findOne({
      _id: args.data.campaignId,
    }).lean();

    // Checks whether campaign exists.
    if (!campaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE),
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.PARAM,
      );
    }

    //if startDate and endDate are not provided, then use the campaign's startDate and endDate
    const startDate = args.data?.startDate ?? campaign.startDate;
    const endDate = args.data?.endDate ?? campaign.endDate;

    //validates startDate and endDate
    validateDate(startDate, endDate);

    // Create a new pledge
    const pledge = await FundraisingCampaignPledge.create({
      campaigns: [args.data.campaignId],
      users: args.data.userIds,
      startDate: startDate,
      endDate: endDate,
      amount: args.data.amount,
      currency: args.data.currency,
    });

    // Update the campaign with the new pledge
    await FundraisingCampaign.updateOne(
      {
        _id: args.data.campaignId,
      },
      {
        $push: { pledges: pledge._id },
      },
    );
    return pledge as InterfaceFundraisingCampaignPledges;
  };
