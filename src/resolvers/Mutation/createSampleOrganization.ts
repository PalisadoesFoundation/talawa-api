import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { createSampleOrganization as createSampleOrgUtil } from "../../utilities/createSampleOrganizationUtil";

/**
 * Generates sample data for testing or development purposes.
 *
 * This resolver performs the following steps:
 *
 * 1. Verifies that the current user exists and is fetched from the cache or database.
 * 2. Checks if the current user has a valid application profile and whether they are authorized.
 * 3. Ensures that the current user is a super admin.
 * 4. Utilizes a utility function to create a sample organization.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param _args - The arguments for the mutation, not used in this resolver.
 * @param _context - The context object, including the user ID and other necessary context for authorization.
 *
 * @returns True if the sample data generation is successful; false otherwise.
 *
 * @remarks This function is intended for creating sample data and should only be accessible by super admins.
 */
export const createSampleOrganization: MutationResolvers["createSampleOrganization"] =
  async (_parent, _args, _context) => {
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([_context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: _context.userId,
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

    if (!currentUserAppProfile.isSuperAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    await createSampleOrgUtil();
    return true;
  };
