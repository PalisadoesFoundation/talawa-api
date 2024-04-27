import UserCache from "../redisCache";
export async function deleteUserFromCache(userId: string): Promise<void> {
  const key = `user:${userId}`;

  await UserCache.del(key);
}
