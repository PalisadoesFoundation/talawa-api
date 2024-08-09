import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { Advertisement, AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Deletes an advertisement based on the provided advertisement ID.
 *
 * This function handles the deletion of an advertisement by first verifying
 * that the current user is authorized to perform this action. It checks
 * whether the user exists in the cache or database, retrieves the user's
 * profile, and ensures that the user has the necessary permissions to delete
 * the advertisement. If the advertisement exists and the user is authorized,
 * it will be deleted, and the deleted advertisement's details will be returned.
 *
 * @param _parent - This is an unused parameter that represents the parent resolver in the GraphQL schema. It can be ignored.
 * @param args - Contains the arguments passed to the GraphQL mutation, specifically the ID of the advertisement to be deleted.
 * @param context - Provides contextual information such as the current user's ID and API root URL. This is used to find the user and validate permissions.
 *
 * @returns The deleted advertisement's details, including the advertisement ID and media URL, if the deletion was successful.
 *
 */
export const deleteAdvertisement: MutationResolvers["deleteAdvertisement"] =
  async (_parent, args, context) => {
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
    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Tries to find the user's profile in the cache.
    let currentAppUserProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentAppUserProfile = appUserProfileFoundInCache[0];

    // If the profile is not found in the cache, tries to find it in the database.
    if (currentAppUserProfile === null) {
      currentAppUserProfile = await AppUserProfile.findOne({
        userId: currentUser._id,
      }).lean();

      // If the profile is found in the database, it is cached for future requests.
      if (currentAppUserProfile !== null) {
        await cacheAppUserProfile([currentAppUserProfile]);
      }
    }

    // If the user's profile is still not found, throws an error indicating the profile does not exist.
    if (!currentAppUserProfile) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Tries to find the advertisement by its ID.
    const existingAdvertisement = await Advertisement.findOne({
      _id: args.id,
    }).lean();

    // If the advertisement is not found, throws an error indicating the advertisement does not exist.
    if (!existingAdvertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the user is either a super admin or an admin of the organization that owns the advertisement.
    const userIsOrgAdmin = currentAppUserProfile.adminFor.some(
      (organization) => organization === existingAdvertisement?.organizationId,
    );

    // If the user is not authorized to delete the advertisement, throws an error.
    if (!(currentAppUserProfile.isSuperAdmin || userIsOrgAdmin)) {
      throw new errors.UnauthenticatedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Prepares the advertisement object for return by including the full media URL and converting the ID to a string.
    const advertisement = {
      ...existingAdvertisement,
      mediaUrl: `${context.apiRootUrl}${existingAdvertisement.mediaUrl}`,
      _id: existingAdvertisement._id.toString(),
    };

    console.log(advertisement);

    // Deletes the advertisement from the database.
    await Advertisement.deleteOne({
      _id: args.id,
    });

    // Returns the details of the deleted advertisement.
    return { advertisement };
  };
