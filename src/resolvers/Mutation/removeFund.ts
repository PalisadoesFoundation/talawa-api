import {
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Fund, User, type InterfaceFund } from "../../models";
import { FundraisingCampaign } from "../../models/FundraisingCampaign";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to remove fund .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the fund  exists.
 * 3. If the user is authorized.
 * 4. If the user is admin of the organization.
 * @returns Deleted fund.
 */

export const removeFund: MutationResolvers["removeFund"] = async (
  parent,
  args,
  context,
): Promise<InterfaceFund> => {
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

  const fund = await Fund.findOne({
    _id: args.id,
  }).lean();

  // Checks whether fund exists.
  if (!fund) {
    throw new errors.NotFoundError(
      requestContext.translate(FUND_NOT_FOUND_ERROR.MESSAGE),
      FUND_NOT_FOUND_ERROR.CODE,
      FUND_NOT_FOUND_ERROR.PARAM,
    );
  }
  const isUserOrganizationAdmin = currentUser.adminFor.some((organization) =>
    organization.equals(fund.organizationId),
  );
  //checks whether the user is admin of organization or not
  if (!(isUserOrganizationAdmin || currentUser.userType === "SUPERADMIN")) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  //deletes all the campaigns associated with the fund
  for (const campaignId of fund.campaigns) {
    await FundraisingCampaign.findByIdAndDelete({
      campaignId,
    });
  }

  //deletes the fund
  await Fund.deleteOne({
    _id: args.id,
  });

  //returns the deleted fund
  return fund;
};
