import { Types } from "mongoose";
import {
  CUSTOM_DATA_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { UserCustomData } from "../../models/UserCustomData";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Removes custom data associated with the current user within a specified organization.
 *
 * This function allows an authorized user, such as an organization admin or super admin, to remove custom data associated with the user within a specific organization. The function first verifies the user's identity and authorization, then proceeds to delete the custom data if it exists.
 *
 * @param _parent - This parameter represents the parent resolver in the GraphQL schema and is not used in this function.
 * @param args - The arguments passed to the GraphQL mutation, including the `organizationId` for which the custom data should be removed.
 * @param context - Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.
 *
 * @returns The removed custom data object if the operation was successful.
 *
 */
export const removeUserCustomData: MutationResolvers["removeUserCustomData"] =
  async (_parent, args, context) => {
    const { organizationId } = args;

    // Tries to find the current user in the cache using the user's ID from the context.
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];

    // If the user is not found in the cache, tries to find them in the database.
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();

      // If the user is found in the database, they are cached for future requests.
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    // If the user is still not found, throws an error indicating the user does not exist.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Tries to find the current user's app profile in the cache.
    let currentUserAppProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentUserAppProfile = appUserProfileFoundInCache[0];

    // If the app profile is not found in the cache, tries to find it in the database.
    if (currentUserAppProfile === null) {
      currentUserAppProfile = await AppUserProfile.findOne({
        userId: currentUser._id,
      }).lean();

      // If the profile is found in the database, it is cached for future requests.
      if (currentUserAppProfile !== null) {
        await cacheAppUserProfile([currentUserAppProfile]);
      }
    }

    // If the user's app profile is not found, throws an error indicating the user is unauthorized.
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Tries to find the specified organization in the database.
    const organization = await Organization.findOne({
      _id: organizationId,
    }).lean();

    // If the organization is not found, throws an error indicating the organization does not exist.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the current user is an admin for the organization or a super admin.
    const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
      (orgId) =>
        orgId && new Types.ObjectId(orgId?.toString()).equals(organization._id),
    );

    // If the user is not an organization admin or a super admin, throws an error indicating they are unauthorized.
    if (
      !(currentUserIsOrganizationAdmin || currentUserAppProfile.isSuperAdmin)
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Tries to find and delete the user's custom data associated with the specified organization.
    const userCustomData = await UserCustomData.findOneAndDelete({
      userId: context.userId,
      organizationId,
    }).lean();

    // If the custom data is not found, throws an error indicating it does not exist.
    if (!userCustomData) {
      throw new errors.NotFoundError(
        requestContext.translate(CUSTOM_DATA_NOT_FOUND.MESSAGE),
        CUSTOM_DATA_NOT_FOUND.CODE,
        CUSTOM_DATA_NOT_FOUND.PARAM,
      );
    }

    // Returns the removed custom data.
    return userCustomData;
  };
