import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Post } from "../../models";
import { getSort } from "./helperFunctions/getSort";

/**
 * This query will fetch the list of all post within an Organization from database.
 * @param _parent-
 * @param args - An object that contains `id` of a user, `orderBy` fields.
 * @returns An object that contains the Post.
 * @remarks The query function uses `getSort()` function to sort the data in specified order.
 */

export const postsByUser: QueryResolvers["postsByUser"] = async (
  _parent,
  args,
  context
) => {
  const sort = getSort(args.orderBy);

  const postsInUser = await Post.find({
    user: args.id,
  })
    .sort(sort)
    .lean();

  const postsWithImageURLResolved = postsInUser.map((post) => ({
    ...post,
    imageUrl: post.imageUrl ? `${context.apiRootUrl}${post.imageUrl}` : null,
    videoUrl: post.videoUrl ? `${context.apiRootUrl}${post.videoUrl}` : null,
  }));

  return postsWithImageURLResolved;
};
