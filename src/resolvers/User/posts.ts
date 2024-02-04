// import  {  Post } from "../../models";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
import { graphqlConnectionFactory } from "../../utilities/graphqlConnectionFactory";
import { parseRelayConnectionArguments } from "../../utilities/parseRelayConnectionArguments";

/**
 * Resolver function to fetch and return posts created by a user from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver.
 * @returns An object containing an array of posts,totalCount of post and pagination information.
 */
export const posts: UserResolvers["posts"] = async (parent, args) => {
  const paginationArgs = parseRelayConnectionArguments(args, 10);

  // If the cursor is not a valid database object, return default GraphQL connection.

  const postConnection = graphqlConnectionFactory<InterfacePost>();

  const query: Record<string, unknown> = {
    creatorId: parent._id,
  };

  // Set query conditions based on pagination direction.
  if (paginationArgs.cursor) {
    if (paginationArgs.direction == "FORWARD") {
      query._id = { $lt: paginationArgs.cursor };
    } else if (paginationArgs.direction == "BACKWARD") {
      query._id = { $gt: paginationArgs.cursor };
    }
  }
  const totalCount = await Post.countDocuments(query);
  // Fetch posts from the database.
  const posts = await Post.find(query)
    .sort({ _id: paginationArgs.direction == "BACKWARD" ? 1 : -1 })
    .limit(paginationArgs.limit + 1)
    .lean();
  //if no posts found then return default graphqlConnection
  if (!posts || posts.length == 0) {
    return postConnection;
  }
  // Check if there are more posts beyond the limit.
  if (posts.length > paginationArgs.limit) {
    if (paginationArgs.direction == "FORWARD") {
      postConnection.pageInfo.hasNextPage = true;
    } else {
      postConnection.pageInfo.hasPreviousPage = true;
    }
    posts.pop(); // Remove the extra post beyond the limit.
  }

  // Reverse posts if fetching in backward direction.
  if (paginationArgs.direction == "BACKWARD") {
    posts.reverse();
  }

  // Map posts to edges format.
  postConnection.edges = posts.map((post) => ({
    node: post,
    cursor: post._id.toString(),
  }));
  postConnection.totalCount = totalCount;

  // Set startCursor and endCursor in pageInfo.
  postConnection.pageInfo.startCursor = postConnection.edges[0]?.cursor;
  postConnection.pageInfo.endCursor =
    postConnection.edges[postConnection.edges.length - 1]?.cursor;

  return {
    edges: postConnection.edges,
    pageInfo: postConnection.pageInfo,
    totalCount: postConnection.totalCount,
  };
};
