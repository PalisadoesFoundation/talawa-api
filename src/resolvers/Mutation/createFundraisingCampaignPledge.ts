import {
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { AppUserProfile, FundraisingCampaign, User } from "../../models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { type MutationResolvers } from "../../types/generatedGraphQLTypes";
import { validateDate } from "../../utilities/dateValidator";

/**
 * Creates a new pledge for a fundraising campaign.
 *
 * This function performs the following actions:
 * 1. Verifies the existence of the current user.
 * 2. Retrieves and caches the user's details if not already cached.
 * 3. Checks the validity of the provided or default campaign start and end dates.
 * 4. Verifies the existence of the specified fundraising campaign.
 * 5. Creates a new pledge for the specified campaign with the given details.
 * 6. Updates the campaign to include the newly created pledge.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.campaignId`: The ID of the fundraising campaign for which the pledge is being created.
 *   - `data.userIds`: An array of user IDs associated with the pledge.
 *   - `data.startDate`: The start date of the pledge (optional; defaults to the campaign's start date).
 *   - `data.endDate`: The end date of the pledge (optional; defaults to the campaign's end date).
 *   - `data.amount`: The amount pledged.
 *   - `data.currency`: The currency of the pledged amount.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user performing the operation.
 *
 * @returns The created pledge record.
 *
 */
export const createFundraisingCampaignPledge: MutationResolvers["createFundraisingCampaignPledge"] =
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

    // If startDate and endDate are not provided, then use the campaign's startDate and endDate.
    const startDate = args.data?.startDate ?? campaign.startDate;
    const endDate = args.data?.endDate ?? campaign.endDate;

    // Validates startDate and endDate.
    validateDate(startDate, endDate);

    // Create a new pledge.
    const pledge = await FundraisingCampaignPledge.create({
      campaign: args.data.campaignId,
      users: args.data.userIds,
      startDate: startDate,
      endDate: endDate,
      amount: args.data.amount,
      currency: args.data.currency,
    });

    // Update the user with the new pledge and campaign
    await AppUserProfile.updateMany(
      {
        userId: { $in: args.data.userIds },
      },
      {
        $addToSet: { pledges: pledge._id, campaigns: args.data.campaignId },
      },
    );

    // Update the campaign with the new pledge.
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
