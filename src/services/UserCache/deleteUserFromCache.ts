import UserCache from "../redisCache";

export async function deleteUserFromCache(userId: string): Promise<void> {
  // Construct the key for the user in the cache
  const key = `user:${userId}`;

  // Delete the user entry from the Redis cache
  await UserCache.del(key);
}
