import { Types } from "mongoose";
import {
  ORGANIZATION_MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceOrganization,
  InterfaceAppUserProfile,
} from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
/**
 * This function enables to create an admin for an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user has appUserProfile
 * 3. If the current user is the creator of the organization
 * 4. If the user exists
 * 5. If the user is a member of the organization
 * 6. If the user is already an admin of the organization
 * @returns Updated appUserProfile
 */
export const createAdmin: MutationResolvers["createAdmin"] = async (
  _parent,
  args,
  context,
) => {
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    }).lean();

    await cacheOrganizations([organization as InterfaceOrganization]);
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }
  // Checks whether the current user is a superAdmin
  const currentUser = await User.findById({
    _id: context.userId,
  });
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

  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);
  const userAppProfile = await AppUserProfile.findOne({
    userId: args.data.userId,
  }).lean();
  1;
  if (!userAppProfile) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const userExists = !!(await User.exists({
    _id: args.data.userId,
  }));

  // Checks whether user with _id === args.data.userId exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const userIsOrganizationMember = organization.members.some((member) =>
    new Types.ObjectId(member).equals(args.data.userId),
  );

  // Checks whether user with _id === args.data.userId is not a member of organization.
  if (userIsOrganizationMember === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_MEMBER_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_MEMBER_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_MEMBER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    new Types.ObjectId(admin).equals(args.data.userId),
  );

  // Checks whether user with _id === args.data.userId is already an admin of organization.
  if (userIsOrganizationAdmin === true) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Adds args.data.userId to admins list of organization's document.
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $push: {
        admins: args.data.userId,
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
  Adds organization._id to adminFor list on appUserProfile's document with userId === args.data.userId
  and returns the updated appUserProfile of the user.
  */
  return (await AppUserProfile.findOneAndUpdate(
    {
      _id: userAppProfile._id,
    },
    {
      $push: {
        adminFor: organization._id,
      },
    },
    {
      new: true,
    },
  )
    .select(["-password"])
    .lean()) as InterfaceAppUserProfile;
};
