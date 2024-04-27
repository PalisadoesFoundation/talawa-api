import { Types } from "mongoose";
import { logger } from "../../libraries";
import type { InterfaceUser } from "../../models";
import UserCache from "../redisCache";

export async function findUserInCache(
  ids: string[],
): Promise<(InterfaceUser | null)[]> {
  if (ids.length === 0) {
    return [null];
  }
  const keys: string[] = ids.map((id) => {
    return `user:${id}`;
  });
  const userFoundInCache = await UserCache.mget(keys);
  const users = userFoundInCache.map((user: string | null) => {
    if (user === null) {
      return null;
    }
    try {
      const parsedUser = JSON.parse(user);
      return {
        ...parsedUser,
        _id: new Types.ObjectId(parsedUser._id),
        appUserProfileId: new Types.ObjectId(parsedUser.appUserProfileId),
        joinedOrganizations:
          parsedUser.joinedOrganizations.length !== 0
            ? parsedUser.joinedOrganizations.map((org: string) => {
                return new Types.ObjectId(org);
              })
            : [],
        membershipRequests:
          parsedUser.membershipRequests.length !== 0
            ? parsedUser.membershipRequests.map((request: string) => {
                return new Types.ObjectId(request);
              })
            : [],
        organizationsBlockedBy:
          parsedUser.organizationsBlockedBy.length !== 0
            ? parsedUser.organizationsBlockedBy.map((org: string) => {
                return new Types.ObjectId(org);
              })
            : [],
        registeredEvents:
          parsedUser.registeredEvents.length !== 0
            ? parsedUser.registeredEvents.map((event: string) => {
                return new Types.ObjectId(event);
              })
            : [],
      };
    } catch (error) {
      logger.info(`Error parsing user from cache: ${error}`);
    }
  });
  return users;
}
