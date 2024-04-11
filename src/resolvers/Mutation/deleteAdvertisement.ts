import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceUser} from "../../models";
import {
  Advertisement,
  AppUserProfile,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

export const deleteAdvertisement: MutationResolvers["deleteAdvertisement"] =
  async (_parent, args, context) => {
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

    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    let currentAppUserProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentAppUserProfile = appUserProfileFoundInCache[0];
    if (currentAppUserProfile === null) {
      currentAppUserProfile = await AppUserProfile.findOne({
        userId: currentUser._id,
      }).lean();
      if (currentAppUserProfile !== null) {
        await cacheAppUserProfile([currentAppUserProfile]);
      }
    }
    if (!currentAppUserProfile) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const existingAdvertisement = await Advertisement.findOne({
      _id: args.id,
    }).lean();

    if (!existingAdvertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM,
      );
    }
    const userIsOrgAdmin = currentAppUserProfile.adminFor.some(
      (organization) => organization === existingAdvertisement?.organizationId,
    );
    if (!(currentAppUserProfile.isSuperAdmin || userIsOrgAdmin)) {
      throw new errors.UnauthenticatedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const advertisement = {
      ...existingAdvertisement,
      mediaUrl: `${context.apiRootUrl}${existingAdvertisement.mediaUrl}`,
      _id: existingAdvertisement._id.toString(),
    };
    console.log(advertisement);
    // Deletes the ad.
    await Advertisement.deleteOne({
      _id: args.id,
    });
    // Returns deleted ad.
    return { advertisement };
  };
