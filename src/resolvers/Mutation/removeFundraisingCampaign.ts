import {
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import {
  Fund,
  FundraisingCampaign,
  User,
  type InterfaceFundraisingCampaign,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to remove fundraising campaign .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the fundraising campaign  exists.
 * 3. If the user is authorized.
 * 4. If the user is admin of the organization.
 * @returns Deleted fundraising campaign.
 */

export const removeFundraisingCampaign: MutationResolvers["removeFundraisingCampaign"] =
  async (_parent, args, context): Promise<InterfaceFundraisingCampaign> => {
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
      _id: args.id,
    }).lean();

    // Checks whether fundraising campaign exists.
    if (!campaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE),
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.PARAM,
      );
    }
    const fund = await Fund.findOne({
      _id: campaign.fundId?.toString(),
    }).lean();

    // Checks whether parent fund exists.
    if (!fund) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_NOT_FOUND_ERROR.MESSAGE),
        FUND_NOT_FOUND_ERROR.CODE,
        FUND_NOT_FOUND_ERROR.PARAM,
      );
    }
    const isUserOrgAdmin = currentUser.adminFor.some((orgId) =>
      orgId.equals(fund.organizationId),
    );

    // Checks whether the user is admin of the organization or not.
    if (!(isUserOrgAdmin || currentUser.userType === "SUPERADMIN")) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Deletes the fundraising campaign.
    await FundraisingCampaign.deleteOne({
      _id: args.id,
    });

    // Removes the campaign from the fund.
    await Fund.updateOne(
      {
        _id: fund._id,
      },
      {
        $pull: {
          campaigns: args.id,
        },
      },
    );

    // Returns the deleted fundraising campaign.
    return campaign as InterfaceFundraisingCampaign;
  };
