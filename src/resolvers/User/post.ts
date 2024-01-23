import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the post created by the user from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An array which conatins the post created by the user.
 */

export const posts: UserResolvers["posts"] = async (parent, args) => {
  const pageSize: number =
    (args as { first?: number; last?: number; after?: string; before?: string })
      .first ||
    (args as { first?: number; last?: number; after?: string; before?: string })
      .last ||
    10;
  const query: Record<string, unknown> = {
    creatorId: parent._id,
  };
  if ((args as { after?: string }).after) {
    query._id = { $gt: (args as { after?: string }).after };
  } else if ((args as { before?: string }).before) {
    query._id = { $lt: (args as { before?: string }).before };
  }
  const posts = await Post.find(query)
    .sort({ _id: (args as { before?: string }).before ? -1 : 1 })
    .limit(pageSize)
    .lean();

  const pageInfo = {
    hasNextPage: await hasNextPage(
      parent._id.toString(),
      (args as { after?: string }).after || "",
      (args as { before?: string }).before || "",
      pageSize
    ),
    hasPreviousPage: await hasPreviousPage(
      parent._id.toString(),
      (args as { after?: string }).after || "",
      (args as { before?: string }).before || "",
      pageSize
    ),
    startCursor: posts[0]?._id.toString(),
    endCursor: posts[posts.length - 1]?._id.toString(),
  };
  const edges = posts.map((post) => ({
    node: post,
    cursor: post._id.toString(),
  }));
  return {
    edges,
    pageInfo,
  };
};
async function hasNextPage(
  userId: string,
  after: string,
  before: string,
  pageSize: number
): Promise<boolean> {
  if (before) {
    const firstPostId = await Post.findOne({ creatorId: userId })
      .sort({ _id: 1 })
      .select("_id");
    return firstPostId !== null && firstPostId._id < before;
  } else if (after) {
    const lastPostId = await Post.findOne({ creatorId: userId })
      .sort({ _id: -1 })
      .select("_id");
    return lastPostId !== null && lastPostId._id > after;
  } else {
    const count = await Post.countDocuments({ creatorId: userId });
    return count > pageSize;
  }
}

async function hasPreviousPage(
  userId: string,
  after: string,
  before: string,
  pageSize: number
): Promise<boolean> {
  if (before) {
    const firstPostId = await Post.findOne({ creatorId: userId })
      .sort({ _id: 1 })
      .select("_id");
    return firstPostId !== null && firstPostId._id < before;
  } else if (after) {
    const lastPostId = await Post.findOne({ creatorId: userId })
      .sort({ _id: -1 })
      .select("_id");
    return lastPostId !== null && lastPostId._id > after;
  } else {
    const count = await Post.countDocuments({ creatorId: userId });
    return count > pageSize;
  }
}
