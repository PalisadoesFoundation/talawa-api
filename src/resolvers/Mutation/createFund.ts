import {
  FUND_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization, User } from "../../models";
import { Fund, type InterfaceFund } from "../../models/Fund";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
/**
 * This function enables to create an organization specific fundraising funds.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * 3. If the user is authorized.
 * 4. If the fund already exists
 * @returns Created fund
 */

export const createFund: MutationResolvers["createFund"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceFund> => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });
  // Checks whether currentUser with _id === context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  });

  // Checks whether the organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }
  //checks whether the user is admin of organization or not
  await adminCheck(currentUser._id, organization);

  const exisitingFund = await Fund.findOne({
    name: args.data.name,
    organizationId: args.data.organizationId,
  });
  //checks if the fund already exists
  if (exisitingFund) {
    throw new errors.ConflictError(
      requestContext.translate(FUND_ALREADY_EXISTS.MESSAGE),
      FUND_ALREADY_EXISTS.CODE,
      FUND_ALREADY_EXISTS.PARAM,
    );
  }
  //create Fund with the provided data
  const createdFund = await Fund.create({
    name: args.data.name,
    organizationId: args.data.organizationId,
    refrenceNumber: args.data.refrenceNumber,
    taxDeductible: args.data.taxDeductible,
    isDefault: args.data.isDefault,
    isArchived: args.data.isArchived,
  });

  //push the created fund to the organization funds array
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $push: {
        funds: createdFund._id,
      },
    },
  );

  return createdFund.toObject();
};
