import { Post } from "../../models";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const pinnedPosts: OrganizationResolvers["pinnedPosts"] = async (
  parent
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
