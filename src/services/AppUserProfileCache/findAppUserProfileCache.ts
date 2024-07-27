import { Types } from "mongoose";
import { logger } from "../../libraries";
import type { InterfaceAppUserProfile } from "../../models";
import AppUserCache from "../redisCache";

export async function findAppUserProfileCache(
  ids: string[],
): Promise<(InterfaceAppUserProfile | null)[]> {
  if (ids.length === 0) {
    return [null];
  }
  const keys: string[] = ids.map((id) => {
    return `appUserProfile:${id}`;
  });
  const appUserProfileFoundInCache = await AppUserCache.mget(keys);
  const appUserProfiles = appUserProfileFoundInCache.map(
    (appUserProfile: string | null) => {
      if (appUserProfile === null) {
        return null;
      }
      try {
        const parsedAppUserProfile = JSON.parse(appUserProfile);
        return {
          ...parsedAppUserProfile,
          _id: new Types.ObjectId(parsedAppUserProfile._id),
          userId: new Types.ObjectId(parsedAppUserProfile.userId),
          adminFor:
            parsedAppUserProfile.adminFor.length !== 0
              ? parsedAppUserProfile.adminFor.map((org: string) => {
                  return new Types.ObjectId(org);
                })
              : [],
          createdOrganizations:
            parsedAppUserProfile.createdOrganizations.length !== 0
              ? parsedAppUserProfile.createdOrganizations.map((org: string) => {
                  return new Types.ObjectId(org);
                })
              : [],
          createdEvents:
            parsedAppUserProfile.createdEvents.length !== 0
              ? parsedAppUserProfile.createdEvents.map((event: string) => {
                  return new Types.ObjectId(event);
                })
              : [],
          eventAdmin:
            parsedAppUserProfile.EventAdmin.length !== 0
              ? parsedAppUserProfile.EventAdmin.map((event: string) => {
                  return new Types.ObjectId(event);
                })
              : [],
        };
      } catch (error) {
        logger.info(`Error parsing appUserProfile from cache: ${error}`);
      }
    },
  );
  return appUserProfiles;
}
