import { UserCustomData } from "../../models/UserCustomData";
import { Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

/**
 * This function enables a user to add data for a custom field for a joined organization.
 * @param _parent - parent of the current request
 * @param args - payload provided with the request
 * @param context - context of the entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists.
 * @returns Newly Added User Custom Field.
 */
export const addUserCustomData: MutationResolvers["addUserCustomData"] = async (
  _parent,
  args,
  context,
) => {
  const { organizationId, dataName, dataValue } = args;

  const currentUser = await User.findOne({ _id: context.userId });
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const organization = await Organization.findOne({ _id: organizationId });
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const query = {
    userId: currentUser._id.toString(),
    organizationId: organization._id.toString(),
  };

  let userCustomData = await UserCustomData.findOne(query);

  if (!userCustomData) {
    userCustomData = new UserCustomData({
      organizationId,
      userId: context.userId,
      values: { [dataName]: dataValue },
    });
  } else {
    userCustomData.values = {
      ...userCustomData.values,
      [dataName]: dataValue,
    };
  }

  await userCustomData.save();

  return userCustomData;
};
