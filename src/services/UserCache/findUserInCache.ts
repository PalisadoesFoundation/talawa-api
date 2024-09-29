import { Types } from "mongoose";
import { logger } from "../../libraries";
import type { InterfaceUser } from "../../models";
import UserCache from "../redisCache";

/**
 * Retrieves user data from cache based on provided IDs.
 *
 * @param ids - An array of user IDs to retrieve from cache.
 * @returns A promise resolving to an array of InterfaceUser objects or null if not found in cache.
 */
export async function findUserInCache(
  ids: string[],
): Promise<(InterfaceUser | null)[]> {
  // If no IDs are provided, return an array with null
  if (ids.length === 0) {
    return [null];
  }

  // Generate cache keys for each ID
  const keys: string[] = ids.map((id) => {
    return `user:${id}`;
  });

  // Retrieve user data from cache
  const userFoundInCache = await UserCache.mget(keys);

  // Parse cached JSON data into InterfaceUser objects
  const users = userFoundInCache.map((user: string | null) => {
    if (user === null) {
      return null;
    }
    try {
      const parsedUser = JSON.parse(user);

      // Convert specific fields to Types.ObjectId for Mongoose compatibility
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
      // Log error if parsing fails
      logger.info(`Error parsing user from cache: ${error}`);
    }
  });

  return users;
}
