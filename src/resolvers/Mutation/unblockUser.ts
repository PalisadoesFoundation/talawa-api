import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization, InterfaceUser } from "../../models";
import { MembershipRequest, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import mongoose from "mongoose";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
/**
 * This function enables to unblock user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists.
 * 2. If the user exists
 * 3. If the user is an admin of the organization
 * @returns updated organization.
 */
export const unblockUser: MutationResolvers["unblockUser"] = async (
  _parent,
  args,
  context,
) => {
  let organization: InterfaceOrganization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.organizationId,
  ]);

  if (organizationFoundInCache[0] == null) {
    organization = (await Organization.findOne({
      _id: args.organizationId,
    }).lean()) as InterfaceOrganization;
    if (organization) await cacheOrganizations([organization]);
  } else {
    organization = organizationFoundInCache[0];
  }

  // checks if there exists an organization with _id === args.organizationId
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // ensure user exists
  let user: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([args.userId]);
  user = userFoundInCache[0];
  if (user === null) {
    user = await User.findOne({
      _id: args.userId,
    }).lean();
    if (user !== null) {
      await cacheUsers([user]);
    }
  }

  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // checks if current user is an admin of the organization with _id === args.organizationId
  await adminCheck(context.userId, organization);

  const userIsBlockedFromOrganization = organization.blockedUsers.some(
    (blockedUser) =>
      new mongoose.Types.ObjectId(blockedUser.toString()).equals(user._id),
  );

  // checks if user with _id === args.userId is blocked by organzation with _id == args.organizationId
  if (userIsBlockedFromOrganization === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // remove user from the blockedUsers list inside the organization record
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $set: {
        blockedUsers: organization.blockedUsers.filter(
          (blockedUser) => !user?._id.equals(blockedUser),
        ),
      },
    },
    {
      new: true,
    },
  ).lean();

  if (updatedOrganization !== null) {
    if (updatedOrganization.userRegistrationRequired === true) {
      // create a membership request for the user
      const createdMembershipRequest = await MembershipRequest.create({
        user: user._id,
        organization: organization._id,
      });
      // add membership request to organization
      await Organization.findOneAndUpdate(
        {
          _id: organization._id,
        },
        {
          $push: {
            membershipRequests: createdMembershipRequest._id,
          },
        },
        {
          new: true,
        },
      ).lean();
      // add membership request to user
      await User.updateOne(
        {
          _id: user._id,
        },
        {
          $push: {
            membershipRequests: createdMembershipRequest._id,
          },
        },
      );
    } else {
      // add user to the members list inside the organization record
      await Organization.findOneAndUpdate(
        {
          _id: organization._id,
        },
        {
          $push: {
            members: user._id,
          },
        },
        {
          new: true,
        },
      ).lean();
      // add organization to the joinedOrganizations list inside the user record
      await User.updateOne(
        {
          _id: user._id,
        },
        {
          $push: {
            joinedOrganizations: organization._id,
          },
        },
      ).lean();
    }
    await cacheOrganizations([updatedOrganization]);
  }
  // remove the organization from the organizationsBlockedBy array inside the user record
  return (await User.findOneAndUpdate(
    {
      _id: user._id,
    },
    {
      $set: {
        organizationsBlockedBy: user.organizationsBlockedBy.filter(
          (organizationBlockedBy) =>
            !new mongoose.Types.ObjectId(organization._id.toString()).equals(
              organizationBlockedBy,
            ),
        ),
      },
    },
    {
      new: true,
    },
  )
    .select(["-password"])
    .lean()) as InterfaceUser;
};
