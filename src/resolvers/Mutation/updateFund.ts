import {
  FUND_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization, User } from "../../models";
import { Fund, type InterfaceFund } from "../../models/Fund";
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
 * @returns Updated Fund.
 */

export const updateFund: MutationResolvers["updateFund"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceFund> => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  //Checks if the current user exists
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
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
  adminCheck(currentUser._id, organizaton);
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
