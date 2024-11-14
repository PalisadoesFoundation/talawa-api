import { Post } from "../../models";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `pinnedPosts` field of an `Organization`.
 *
 * This function retrieves the posts that are pinned by a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the IDs of the posts that are pinned.
 * @returns A promise that resolves to the post documents found in the database. These documents represent the posts that are pinned by the organization.
 *
 * @see Post - The Post model used to interact with the posts collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const pinnedPosts: OrganizationResolvers["pinnedPosts"] = async (
  parent,
) => {
  const postsInCache = await findPostsInCache(parent.pinnedPosts);

  if (!postsInCache.includes(null)) {
    return postsInCache;
  }

  const posts = await Post.find({
    _id: {
      $in: parent.pinnedPosts,
    },
  }).lean();

  if (posts !== null) {
    await cachePosts(posts);
  }

  return posts;
};
