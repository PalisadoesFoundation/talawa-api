// import  {  Post } from "../../models";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
import {
  generateConnectionObject,
  getFilterObject,
  getLimit,
  getSortingObject,
} from "../../utilities/graphqlConnectionFactory";
import { parseRelayConnectionArguments } from "../../utilities/parseRelayConnectionArguments";

/**
 * Resolver function to fetch and return posts created by a user from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver.
 * @returns An object containing an array of posts,totalCount of post and pagination information.
 */
export const posts: UserResolvers["posts"] = async (parent, args) => {
  const paginationArgs = parseRelayConnectionArguments(args, 10);

  let query: Record<string, unknown> = {
    creatorId: parent._id,
  };
  const filterObject = getFilterObject(paginationArgs);
  if (filterObject) {
    query = { ...query, ...filterObject };
  }

  //get the sorting object
  const sortingObject = { createdAt: -1 };
  const sortedField = getSortingObject(paginationArgs.direction, sortingObject);

  // Fetch posts from the database.
  const posts = await Post.find(query)
    .sort(sortedField)
    .limit(getLimit(paginationArgs.limit))
    .lean();

  const getNodeFromResult = (object: InterfacePost): InterfacePost => object;

  const result = generateConnectionObject(
    paginationArgs,
    posts,
    getNodeFromResult,
  );
  return result.data;
};
