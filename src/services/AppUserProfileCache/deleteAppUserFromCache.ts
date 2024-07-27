import AppUserCache from "../redisCache";

/**
 * Deletes the specified app user profile from Redis cache.
 *
 * @param appUserProfileId - The string representing the app user profile ID to delete from cache.
 * @returns A promise resolving to void.
 */
export async function deleteAppUserFromCache(
  appUserProfileId: string,
): Promise<void> {
  // Generate the cache key for the app user profile based on its ID
  const key = `appUserProfile:${appUserProfileId}`;

  // Delete the app user profile from Redis cache
  await AppUserCache.del(key);
}
