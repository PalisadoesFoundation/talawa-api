import {
  FUND_ALREADY_EXISTS,
  FUND_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { Fund, type InterfaceFund } from "../../models/Fund";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";

/**
 * This function enables to update an organization specific fund.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the Fund of the organization exists.
 * 3. If the organization exists.
 * 4.If the user is authorized to update the fund.
 * 5. If the fund already exists with the same name.
 * @returns Updated Fund.
 */

export const updateFund: MutationResolvers["updateFund"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceFund> => {
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

  //Checks if the current user exists
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const fund = await Fund.findOne({
    _id: args.id,
  });
  //Checks if the fund exists
  if (!fund) {
    throw new errors.NotFoundError(
      requestContext.translate(FUND_NOT_FOUND_ERROR.MESSAGE),
      FUND_NOT_FOUND_ERROR.CODE,
      FUND_NOT_FOUND_ERROR.PARAM,
    );
  }
  const organizaton = await Organization.findOne({
    _id: fund.organizationId,
  });
  //Checks if the organization exists
  if (!organizaton) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }
  //checks if the user is authorized to update the fund
  await adminCheck(currentUser._id, organizaton);

  //if the name is provided, checks if the fund already exists with the same name
  if (args.data.name) {
    const exisitingFund = await Fund.findOne({
      name: args.data.name,
      organizationId: fund.organizationId,
    });
    //checks if the fund already exists
    if (exisitingFund) {
      throw new errors.ConflictError(
        requestContext.translate(FUND_ALREADY_EXISTS.MESSAGE),
        FUND_ALREADY_EXISTS.CODE,
        FUND_ALREADY_EXISTS.PARAM,
      );
    }
  }
  //updates the fund with the provided data
  const updatedFund = await Fund.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      $set: args.data,
    },
    {
      new: true,
    },
  );
  return updatedFund as InterfaceFund;
};
