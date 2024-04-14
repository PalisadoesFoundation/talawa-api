import { logger } from "../../libraries";
import type { InterfaceUser } from "../../models";
import UserCache from "../redisCache";

export async function cacheUsers(users: InterfaceUser[]): Promise<void> {
  try {
    const pipeline = UserCache.pipeline();
    users.forEach((user) => {
      if (user !== null) {
        const key = `user:${user._id}`;
        pipeline.set(key, JSON.stringify(user));
        pipeline.expire(key, 300);
      }
    });
    await pipeline.exec();
  } catch (error) {
    logger.info(error);
  }
}
