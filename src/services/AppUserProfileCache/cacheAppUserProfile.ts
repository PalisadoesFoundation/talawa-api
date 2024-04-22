import { logger } from "../../libraries";
import type { InterfaceAppUserProfile } from "../../models";
import AppUserCache from "../redisCache";

export async function cacheAppUserProfile(
  appUserProfiles: InterfaceAppUserProfile[],
): Promise<void> {
  try {
    const pipeline = AppUserCache.pipeline();
    appUserProfiles.forEach((appUserProfile) => {
      if (appUserProfile !== null) {
        const key = `appUserProfile:${appUserProfile._id}`;
        // Set the appUserProfile in the cache
        pipeline.set(key, JSON.stringify(appUserProfile));
        // SET the time to live for each of the appUserProfile in the cache to 300s.
        pipeline.expire(key, 300);
      }
    });
  } catch (error) {
    logger.info(error);
  }
}
