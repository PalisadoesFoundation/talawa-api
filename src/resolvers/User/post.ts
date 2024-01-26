import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
import { validateConnectionArgs } from "../../utilities/validateConnectionArgs";
/**
 * This resolver function will fetch and return the post created by the user from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An array which conatins the post created by the user.
 */
export const posts: UserResolvers["posts"] = async (parent, args) => {
  validateConnectionArgs(args);
  const pageSize: number = args.first || args.last || 10;

  const query: Record<string, unknown> = {
    creatorId: parent._id,
  };
  if (args.after) {
    query._id = { $gt: args.after };
  } else if (args.before) {
    query._id = { $lt: args.before };
  }
  const posts = await Post.find(query)
    .sort({ _id: args.before ? -1 : 1 })
    .limit(pageSize)
    .lean();

  const pageInfo = {
    hasNextPage: await hasNextPage(
      parent._id.toString(),
      args.after || "",
      args.before || "",
      pageSize
    ),
    hasPreviousPage: await hasPreviousPage(
      parent._id.toString(),
      args.after || "",
      args.before || "",
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
export async function hasNextPage(
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

export async function hasPreviousPage(
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
