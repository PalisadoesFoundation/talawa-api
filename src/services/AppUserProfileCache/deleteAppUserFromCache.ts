import AppUserCache from "../redisCache";
export async function deleteAppUserFromCache(
  appUserProfileId: string,
): Promise<void> {
  const key = `appUserProfile:${appUserProfileId}`;

  await AppUserCache.del(key);
}
