import { Post } from "../../models";
import type {
  ConnectionPageInfo,
  UserResolvers,
} from "../../types/generatedGraphQLTypes";
import { parseRelayConnectionArguments } from "../../utilities/validateConnectionArgs";
/**
 * This resolver function will fetch and return the post created by the user from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An array which conatins the post created by the user.
 */
const isValidCursor = async (cursor: string | null): Promise<boolean> => {
  const result = await Post.findById(cursor);
  return result ? true : false;
};
export const posts: UserResolvers["posts"] = async (parent, args) => {
  const paginationArgs = parseRelayConnectionArguments(args);
  if (!isValidCursor(paginationArgs.cursor)) {
    return {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    };
  }
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

  const pageInfo: ConnectionPageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  };
  if (posts.length > paginationArgs.limit) {
    if (paginationArgs.direction == "FORWARD") {
      pageInfo.hasNextPage = true;
    } else {
      pageInfo.hasPreviousPage = true;
    }
    posts.pop();
  }
  if (paginationArgs.direction == "BACKWARD") {
    posts.reverse();
  }

  const edges = posts.map((post) => ({
    node: post,
    cursor: post._id.toString(),
  }));
  pageInfo.startCursor = edges[0].cursor;
  1;
  pageInfo.endCursor = edges[edges.length - 1].cursor;
  return {
    edges,
    pageInfo,
  };
};
