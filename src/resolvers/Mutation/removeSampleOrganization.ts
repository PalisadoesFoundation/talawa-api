import { Types } from "mongoose";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, SampleData, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { removeSampleOrganization as removeSampleOrgUtil } from "../../utilities/removeSampleOrganizationUtil";

/**
 * Removes a sample organization from the system.
 *
 * This function allows the deletion of a sample organization by checking the current user's authorization and the existence of the organization.
 * The function first verifies whether the user making the request is authorized by checking if they are either a super admin or an admin of the organization.
 * If the user is authorized and the organization exists, the organization is removed from the system.
 *
 * @param _parent - This is an unused parameter representing the parent resolver in the GraphQL schema. It can be ignored.
 * @param _args - The arguments passed to the GraphQL mutation, which are not used in this function.
 * @param _context - Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.
 *
 * @returns A boolean value indicating whether the operation was successful.
 *
 */
export const removeSampleOrganization: MutationResolvers["removeSampleOrganization"] =
  async (_parent, _args, _context) => {
    // Tries to find the current user in the cache using the user's ID from the context.
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([_context.userId]);
    currentUser = userFoundInCache[0];

    // If the user is not found in the cache, tries to find them in the database.
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: _context.userId,
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

    // Tries to find the existing organization in the sample data.
    const existingOrganization = await SampleData.findOne({
      collectionName: "Organization",
    });

    // If the organization is not found, throws an error indicating the organization does not exist.
    if (!existingOrganization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the current user is an admin for the organization or a super admin.
    const currentUserOrgAdmin = currentUserAppProfile.adminFor.some(
      (org) =>
        org &&
        new Types.ObjectId(org.toString()).equals(
          existingOrganization.documentId,
        ),
    );

    // If the user is not an organization admin or a super admin, throws an error indicating they are unauthorized.
    if (!currentUserAppProfile.isSuperAdmin && !currentUserOrgAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Calls the utility function to remove the sample organization.
    await removeSampleOrgUtil();

    // Returns true if the organization was successfully removed.
    return true;
  };
