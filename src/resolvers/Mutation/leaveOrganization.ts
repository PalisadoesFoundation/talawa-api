import type { UpdateQuery } from "mongoose";
import { Types } from "mongoose";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization, InterfaceUser } from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function enables to leave an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user exists
 * 3. If the user is the creator of the organization
 * 4. If the user is a member of the organization
 * @returns Updated user
 */
export const leaveOrganization: MutationResolvers["leaveOrganization"] = async (
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
    if (organization) await cacheOrganizations([organization]);
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

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
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const currentUserIsOrganizationMember = organization.members.some((member) =>
    new Types.ObjectId(member).equals(currentUser?._id),
  );

  // Checks whether currentUser is not a member of organzation.
  if (!currentUserIsOrganizationMember) {
    throw new errors.ConflictError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserIsOrgAdmin = organization.admins.some((admin) =>
    new Types.ObjectId(admin).equals(currentUser._id),
  );

  // Removes currentUser._id from admins and members lists of organzation's document.

  let updateQuery: UpdateQuery<InterfaceOrganization> = {
    $pull: {
      members: currentUser._id,
    },
  };
  if (currentUserIsOrgAdmin) {
    await AppUserProfile.updateOne(
      {
        userId: currentUser._id,
      },
      {
        $pull: {
          organizations: organization._id,
        },
      },
    );
    updateQuery = {
      $pull: {
        members: currentUser._id,
        admins: currentUser._id,
      },
    };
  }

  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    updateQuery,
    {
      new: true,
    },
  );

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }
  /*
  Removes organization._id from joinedOrganizations list of currentUser's document
  and returns the updated currentUser.
  */

  return (await User.findOneAndUpdate(
    {
      _id: currentUser._id,
    },
    {
      $pull: {
        joinedOrganizations: organization._id,
        adminFor: organization._id,
      },
    },
    {
      new: true,
    },
  )
    .select(["-password"])
    .lean()) as InterfaceUser;
};
