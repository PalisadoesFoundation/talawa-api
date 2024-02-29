import OrganizationCache from "../redisCache";
import type { InterfaceOrganization } from "../../models";
import { Types } from "mongoose";
import { logger } from "../../libraries";

export async function findOrganizationsInCache(
  ids: string[],
): Promise<(InterfaceOrganization | null)[]> {
  if (ids.length === 0) {
    return [null];
  }

  const keys: string[] = ids.map((id) => {
    return `organization:${id}`;
  });

  const organizationFoundInCache = await OrganizationCache.mget(keys);

  const organizations = organizationFoundInCache.map((org: string | null) => {
    if (org === null) {
      return null;
    }

    try {
      const organization = JSON.parse(org);

      // Note: While JSON parsing successfully restores the fields, including those with
      // Mongoose Object IDs, these fields are returned as strings due to the serialization
      // process. To ensure accurate data representation, we manually convert these string
      // values back to their original Mongoose Object ID types before delivering them to
      // the requesting resolver.

      return {
        ...organization,

        createdAt: new Date(organization.createdAt),

        _id: Types.ObjectId.createFromHexString(organization._id),

        admins: organization?.admins?.map((admin: string) => {
          return Types.ObjectId.createFromHexString(admin.toString());
        }),

        members:
          organization.members.length !== 0
            ? organization.members?.map((member: string) => {
                return Types.ObjectId.createFromHexString(member.toString());
              })
            : [],

        creatorId: Types.ObjectId.createFromHexString(
          organization.creatorId.toString(),
        ),

        updatedAt: new Date(organization.updatedAt),

        groupChats:
          organization.groupChats.length !== 0
            ? organization.groupChat.map((groupChat: string) => {
                return Types.ObjectId.createFromHexString(groupChat.toString());
              })
            : [],

        posts:
          organization.posts.length !== 0
            ? organization.posts?.map((post: string) => {
                return Types.ObjectId.createFromHexString(post.toString());
              })
            : [],

        pinnedPosts:
          organization.pinnedPosts.length !== 0
            ? organization.pinnedPosts?.map((pinnedPost: string) => {
                return Types.ObjectId.createFromHexString(
                  pinnedPost.toString(),
                );
              })
            : [],

        membershipRequests:
          organization.membershipRequests.length !== 0
            ? organization.membershipRequests.map(
                (membershipRequest: string) => {
                  return Types.ObjectId.createFromHexString(
                    membershipRequest.toString(),
                  );
                },
              )
            : [],

        blockedUsers:
          organization.blockedUsers.length !== 0
            ? organization.blockedUsers.map((blockedUser: string) => {
                return Types.ObjectId.createFromHexString(
                  blockedUser.toString(),
                );
              })
            : [],
      };
    } catch (parseError) {
      logger.info(`Error parsing JSON:${parseError}`);
    }
  });

  return organizations;
}
