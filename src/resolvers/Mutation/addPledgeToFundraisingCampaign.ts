import {
  FUNDRAISING_CAMPAIGN_ALREADY_ADDED,
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MADE_PLEDGE_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { FundraisingCampaign, User } from "../../models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Mutation resolver to add a pledge to a fundraising campaign.
 *
 * This function adds a specified pledge to a fundraising campaign. It performs several checks:
 *
 * 1. Verifies that the current user exists.
 * 2. Confirms that the pledge exists.
 * 3. Checks that the campaign exists.
 * 4. Ensures the user has made the pledge.
 * 5. Verifies that the campaign is not already associated with the pledge.
 *
 * If any of these conditions are not met, appropriate errors are thrown.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `pledgeId`: The ID of the pledge to be added.
 *   - `campaignId`: The ID of the campaign to which the pledge will be added.
 * @param context - The context of the entire application, containing user information and other context-specific data.
 *
 * @returns A promise that resolves to the updated pledge object.
 *
 */
export const addPledgeToFundraisingCampaign: MutationResolvers["addPledgeToFundraisingCampaign"] =
  async (
    _parent,
    args,
    context,
  ): Promise<InterfaceFundraisingCampaignPledges> => {
    let currentUser: InterfaceUser | null;

    const userFoundInCache = await findUserInCache([context.userId]);

    currentUser = userFoundInCache[0];

    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    // Checks whether the current user exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const pledge = await FundraisingCampaignPledge.findOne({
      _id: args.pledgeId,
    }).lean();

    // Checks whether the pledge exists.
    if (!pledge) {
      throw new errors.NotFoundError(
        requestContext.translate(
          FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.MESSAGE,
        ),
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.PARAM,
      );
    }

    const campaign = await FundraisingCampaign.findOne({
      _id: args.campaignId,
    }).lean();

    // Checks whether the campaign exists.
    if (!campaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE),
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether the user has made the pledge.
    const pledgeUserIds = pledge.users.map((id) => id?.toString());
    if (!pledgeUserIds.includes(context.userId)) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_MADE_PLEDGE_ERROR.MESSAGE),
        USER_NOT_MADE_PLEDGE_ERROR.CODE,
        USER_NOT_MADE_PLEDGE_ERROR.PARAM,
      );
    }

    // Checks whether the campaign is already added to the pledge.
    if (pledge.campaign?.toString() === args.campaignId) {
      throw new errors.ConflictError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_ALREADY_ADDED.MESSAGE),
        FUNDRAISING_CAMPAIGN_ALREADY_ADDED.CODE,
        FUNDRAISING_CAMPAIGN_ALREADY_ADDED.PARAM,
      );
    }

    // Add the campaign to the pledge.
    const updatedPledge = await FundraisingCampaignPledge.findOneAndUpdate(
      {
        _id: args.pledgeId,
      },
      {
        campaign: args.campaignId,
      },
      { new: true },
    );

    // Add the pledge to the campaign.
    await FundraisingCampaign.updateOne(
      {
        _id: args.campaignId,
      },
      {
        $push: { pledges: args.pledgeId },
      },
    );

    return updatedPledge as InterfaceFundraisingCampaignPledges;
  };
