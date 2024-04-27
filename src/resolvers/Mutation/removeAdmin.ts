import mongoose from "mongoose";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_ORGANIZATION_ADMIN,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Organization, User } from "../../models";

import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
/**
 * This function enables to remove an admin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists.
 * 3. If the user to be removed is an admin.
 * 4. If the user removing the admin is the creator of the organization
 * 5 .If the current user and user has appUserProfile or not
 * @returns Updated appUserProfile.
 */
export const removeAdmin: MutationResolvers["removeAdmin"] = async (
  _parent,
  args,
  context,
) => {
  let organization: InterfaceOrganization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  if (organizationFoundInCache[0] === null) {
    organization = (await Organization.findOne({
      _id: args.data.organizationId,
    }).lean()) as InterfaceOrganization;
    if (organization != null) {
      await cacheOrganizations([organization]);
    }
  } else {
    organization = organizationFoundInCache[0];
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

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
      USER_NOT_FOUND_ERROR.MESSAGE,
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const userAppProfile = await AppUserProfile.findOne({
    userId: user._id,
  }).lean();
  if (!userAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  // Checks whether user is an admin of the organization.
  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    new mongoose.Types.ObjectId(admin.toString()).equals(user._id),
  );

  if (!userIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_ORGANIZATION_ADMIN.MESSAGE}`),
      USER_NOT_ORGANIZATION_ADMIN.CODE,
      USER_NOT_ORGANIZATION_ADMIN.PARAM,
    );
  }

  // Checks whether the current user is a superadmin.
  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

  // Removes user._id from admins list of the organization.
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $set: {
        admins: organization.admins.filter(
          (admin) => admin.toString() !== user._id.toString(),
        ),
      },
    },
    {
      new: true,
    },
  );

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }

  // Removes organization._id from adminFor list of the appUserProfile and returns the updated userProfile.
  return (await AppUserProfile.findOneAndUpdate(
    {
      _id: userAppProfile._id,
    },
    {
      $set: {
        adminFor: userAppProfile.adminFor.filter(
          (adminForOrganization) =>
            adminForOrganization &&
            adminForOrganization.toString() !== organization._id.toString(),
        ),
      },
    },
    {
      new: true,
    },
  ).lean()) as InterfaceAppUserProfile;
};
