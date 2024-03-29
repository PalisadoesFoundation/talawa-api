import { Types } from "mongoose";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_BLOCKING_SELF,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import type { InterfaceUser } from "../../models";
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
  context,
) => {
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();
    if (organization) {
      await cacheOrganizations([organization]);
    }
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const userExists = !!(await User.exists({
    _id: args.userId,
  }));

  // Checks whether user with _id === args.userId exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check whether the user - args.userId is a member of the organization before blocking
  const userIsOrganizationMember = organization?.members.some(
    (member) =>
      member === args.userId || new Types.ObjectId(member).equals(args.userId),
  );

  if (!userIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM,
    );
  }

  if (args.userId === context.userId) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_BLOCKING_SELF.MESSAGE),
      USER_BLOCKING_SELF.CODE,
      USER_BLOCKING_SELF.PARAM,
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organization.
  await adminCheck(context.userId, organization);

  const userIsBlocked = organization.blockedUsers.some((blockedUser) =>
    new Types.ObjectId(blockedUser).equals(args.userId),
  );

  // Checks whether user with _id === args.userId is already blocked from organization.
  if (userIsBlocked === true) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  /*
  Adds args.userId to blockedUsers list on organization's document.
  Removes args.userId from the organization's members list
  */
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $push: {
        blockedUsers: args.userId,
      },
      $pull: {
        members: args.userId,
      },
    },
    {
      new: true,
    },
  );

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }

  /*
  Adds organization._id to organizationsBlockedBy list on user's document
  with _id === args.userId and returns the updated user.
  Remove organization's id from joinedOrganizations list on args.userId.
  */
  return (await User.findOneAndUpdate(
    {
      _id: args.userId,
    },
    {
      $push: {
        organizationsBlockedBy: organization._id,
      },
      $pull: {
        joinedOrganizations: organization._id,
      },
    },
    {
      new: true,
    },
  )
    .select(["-password"])
    .lean()) as InterfaceUser;
};
