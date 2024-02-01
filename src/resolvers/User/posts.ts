import { Post } from "../../models";
import type {
  ConnectionPageInfo,
  UserResolvers,
} from "../../types/generatedGraphQLTypes";
import { graphqlConnectionFactory } from "../../utilities/graphqlConnectionFactory";
import { parseRelayConnectionArguments } from "../../utilities/parseRelayConnectionArguments";

/**
 * Checks if a given cursor corresponds to a valid database object.
 * @param cursor - The cursor to check.
 * @returns A Promise that resolves to true if the cursor corresponds to a valid database object, otherwise false.
 */
const isValidCursor = async (cursor: string | null): Promise<boolean> => {
  const result = await Post.findById(cursor);
  return result ? true : false;
};

/**
 * Resolver function to fetch and return posts created by a user from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver.
 * @returns An object containing an array of posts,totalCount of post and pagination information.
 */
export const posts: UserResolvers["posts"] = async (parent, args) => {
  const paginationArgs = parseRelayConnectionArguments(args, 10);

  // If the cursor is not a valid database object, return default GraphQL connection.
  if (!isValidCursor(paginationArgs.cursor)) {
    return graphqlConnectionFactory();
  }

  const query: Record<string, unknown> = {
    creatorId: parent._id,
  };

  // Set query conditions based on pagination direction.
  if (paginationArgs.direction == "FORWARD") {
    query._id = { $lt: paginationArgs.cursor };
  } else if (paginationArgs.direction == "BACKWARD") {
    query._id = { $gt: paginationArgs.cursor };
  }
  const totalCount = await Post.countDocuments(query);
  // Fetch posts from the database.
  const posts = await Post.find(query)
    .sort({ _id: paginationArgs.direction == "BACKWARD" ? 1 : -1 })
    .limit(paginationArgs.limit + 1)
    .lean();

  // Initialize pageInfo with default values.
  const pageInfo: ConnectionPageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  };

  // Check if there are more posts beyond the limit.
  if (posts.length > paginationArgs.limit) {
    if (paginationArgs.direction == "FORWARD") {
      pageInfo.hasNextPage = true;
    } else {
      pageInfo.hasPreviousPage = true;
    }
    posts.pop(); // Remove the extra post beyond the limit.
  }

  // Reverse posts if fetching in backward direction.
  if (paginationArgs.direction == "BACKWARD") {
    posts.reverse();
  }

  // Map posts to edges format.
  const edges = posts.map((post) => ({
    node: post,
    cursor: post._id.toString(),
  }));

  // Set startCursor and endCursor in pageInfo.
  pageInfo.startCursor = edges[0]?.cursor;
  pageInfo.endCursor = edges[edges.length - 1]?.cursor;

  return {
    edges,
    pageInfo,
    totalCount,
  };
};
