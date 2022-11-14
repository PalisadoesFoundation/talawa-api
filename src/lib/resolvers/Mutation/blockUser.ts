import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { Organization, User } from "../../models";
/**
 * This function enables blocking a user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user exists
 * 3. If the user is an admin of organization
 * 4. If the user to be blocked is already blocked by the organization
 * @returns Deleted updated user
 */
export const blockUser: MutationResolvers["blockUser"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const userExists = await User.exists({
    _id: args.userId,
  });

  // Checks whether user with _id === args.userId exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organization.
  adminCheck(context.userId, organization);

  const userIsBlocked = organization.blockedUsers.some(
    (blockedUser) => blockedUser.toString() === args.userId.toString()
  );

  // Checks whether user with _id === args.userId is already blocked from organization.
  if (userIsBlocked === true) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Adds args.userId to blockedUsers list on organization's document.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $push: {
        blockedUsers: args.userId,
      },
    }
  );

  /*
  Adds organization._id to organizationsBlockedBy list on user's document
  with _id === args.userId and returns the updated user.
  */
  return await User.findOneAndUpdate(
    {
      _id: args.userId,
    },
    {
      $push: {
        organizationsBlockedBy: organization._id,
      },
    },
    {
      new: true,
    }
  )
    .select(["-password"])
    .lean();
};
