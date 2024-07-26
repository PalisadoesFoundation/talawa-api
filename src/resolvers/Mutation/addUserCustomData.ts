import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { Organization, User } from "../../models";
import { UserCustomData } from "../../models/UserCustomData";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Mutation resolver to add or update custom data for a user within a joined organization.
 *
 * This function allows a user to add or update a custom field with a name and value for an organization
 * they are a part of. It performs several checks and operations:
 *
 * 1. Validates that the user exists.
 * 2. Verifies that the organization exists.
 * 3. Checks if user custom data for the given organization already exists.
 * 4. If it exists, updates the custom field; if not, creates a new entry.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `organizationId`: The ID of the organization for which custom data is being added.
 *   - `dataName`: The name of the custom data field.
 *   - `dataValue`: The value of the custom data field.
 * @param context - The context of the entire application, including user information and other context-specific data.
 *
 * @returns A promise that resolves to the newly added or updated user custom data object.
 *
 */
export const addUserCustomData: MutationResolvers["addUserCustomData"] = async (
  _parent,
  args,
  context,
) => {
  const { organizationId, dataName, dataValue } = args;

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
