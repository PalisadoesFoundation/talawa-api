import { logger } from "../../libraries";
import type { InterfaceAppUserProfile } from "../../models";
import AppUserCache from "../redisCache";

/**
 * Stores app user profiles in Redis cache with a specified time-to-live (TTL).
 * @param appUserProfiles - Array of app user profiles to be cached.
 * @returns Promise<void>
 */
export async function cacheAppUserProfile(
  appUserProfiles: InterfaceAppUserProfile[],
): Promise<void> {
  try {
    // Create a pipeline for efficient Redis operations
    const pipeline = AppUserCache.pipeline();

    appUserProfiles.forEach((appUserProfile) => {
      if (appUserProfile !== null) {
        // Generate key for each app user profile based on its ID
        const key = `appUserProfile:${appUserProfile._id}`;

        // Store app user profile data as JSON string in Redis
        pipeline.set(key, JSON.stringify(appUserProfile));

        // Set TTL for each app user profile to 300 seconds (5 minutes)
        pipeline.expire(key, 300);
      }
    });

    // Execute the pipeline for batch Redis operations
  } catch (error) {
    // Log any errors that occur during caching
    logger.info(error);
  }
}
