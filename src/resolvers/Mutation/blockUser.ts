import mongoose from "mongoose";
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
 * Mutation resolver function to block a user from an organization.
 *
 * This function performs the following actions:
 * 1. Verifies that the organization specified by `args.organizationId` exists.
 * 2. Ensures that the user specified by `args.userId` exists.
 * 3. Checks if the user attempting to block the user is an admin of the organization.
 * 4. Verifies if the user to be blocked is currently a member of the organization.
 * 5. Ensures that the user is not attempting to block themselves.
 * 6. Blocks the user by adding them to the organization's `blockedUsers` list and removing them from the `members` list.
 * 7. Updates the user's document to reflect that they have been blocked by the organization, and removes the organization from their `joinedOrganizations` list.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `organizationId`: The ID of the organization from which the user is to be blocked.
 *   - `userId`: The ID of the user to be blocked.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the updated user document after blocking.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see User - The User model used to interact with the users collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see adminCheck - Utility function to check if the current user is an admin of the organization.
 * @see findOrganizationsInCache - Service function to retrieve organizations from cache.
 * @see cacheOrganizations - Service function to cache updated organization data.
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
      member === args.userId ||
      new mongoose.Types.ObjectId(member.toString()).equals(args.userId),
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
    new mongoose.Types.ObjectId(blockedUser.toString()).equals(args.userId),
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
  Removes args.userId from the organization's members list.
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
  Adds organization._id to organizationsBlockedBy list on user's document.
  Removes organization._id from joinedOrganizations list on user's document.
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
