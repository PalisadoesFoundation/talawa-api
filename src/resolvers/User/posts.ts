import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
import { parseRelayConnectionArguments } from "../../utilities/validateConnectionArgs";
/**
 * This resolver function will fetch and return the post created by the user from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An array which conatins the post created by the user.
 */

export const posts: UserResolvers["posts"] = async (parent, args) => {
  const paginationArgs = parseRelayConnectionArguments(args);

  const query: Record<string, unknown> = {
    creatorId: parent._id,
  };
  if (paginationArgs.direction == "FORWARD") {
    query._id = { $lt: paginationArgs.cursor };
  } else if (paginationArgs.direction == "BACKWARD") {
    query._id = { $gt: paginationArgs.cursor };
  }
  const posts = await Post.find(query)
    .sort({ _id: paginationArgs.direction == "BACKWARD" ? 1 : -1 })
    .limit(paginationArgs.limit + 1)
    .lean();

  if (paginationArgs.direction == "BACKWARD") {
    posts.reverse();
  }
  const pageInfo = {
    hasNextPage: paginationArgs.direction == "FORWARD" ? true : false,
    hasPreviousPage: paginationArgs.direction == "BACKWARD" ? true : false,
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
