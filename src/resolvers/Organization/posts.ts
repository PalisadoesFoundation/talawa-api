// import  {  Post } from "../../models";
import type { Types } from "mongoose";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import {
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
} from "../../utilities/graphQLConnection";

import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";

/**
 * Resolver function for the `posts` field of an `Organization`.
 *
 * This resolver is used to resolve the `posts` field of an `Organization` type.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the organization.
 * @param args - The arguments provided to the field. These arguments are used to filter, sort, and paginate the posts.
 * @param context - The context object passed to the GraphQL resolvers. It contains the API root URL, which is used to construct the media URL for each post.
 * @returns A promise that resolves to a connection object containing the posts of the organization.
 *
 * @see Post - The Post model used to interact with the posts collection in the database.
 * @see parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 * @see transformToDefaultGraphQLConnection - The function used to transform the list of posts into a connection object.
 * @see getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 * @see getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 * @see MAXIMUM_FETCH_LIMIT - The maximum number of posts that can be fetched in a single request.
 * @see GraphQLError - The error class used to throw GraphQL errors.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const posts: OrganizationResolvers["posts"] = async (
  parent,
  args,
  context,
) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
          organization: parent._id,
        }),
      maximumLimit: MAXIMUM_FETCH_LIMIT,
    });
  if (!parseGraphQLConnectionArgumentsResult.isSuccessful) {
    throw new GraphQLError("Invalid arguments provided.", {
      extensions: {
        code: "INVALID_ARGUMENTS",
        errors: parseGraphQLConnectionArgumentsResult.errors,
      },
    });
  }
  const { parsedArgs } = parseGraphQLConnectionArgumentsResult;

  const filter = getCommonGraphQLConnectionFilter({
    cursor: parsedArgs.cursor,
    direction: parsedArgs.direction,
  });

  //get the sorting object

  const sort = getCommonGraphQLConnectionSort({
    direction: parsedArgs.direction,
  });

  const [objectList, totalCount] = await Promise.all([
    Post.find({
      ...filter,
      organization: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .populate({
        path: "likedBy",
        select: "image firstName lastName",
      })
      .lean()
      .exec(),

    Post.find({
      organization: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);
  const posts = objectList.map((post: InterfacePost) => ({
    ...post,
    imageUrl: post.imageUrl
      ? new URL(post.imageUrl, context.apiRootUrl).toString()
      : null,
    videoUrl: post.videoUrl
      ? new URL(post.videoUrl, context.apiRootUrl).toString()
      : null,
  }));
  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfacePost,
    InterfacePost
  >({
    objectList: posts,
    parsedArgs,
    totalCount,
  });
};
/*
This is typescript type of the parsed cursor for this connection resolver.
*/
type ParsedCursor = string;

/**
 * Parses the cursor value for the `posts` connection resolver.
 *
 * This function is used to parse the cursor value for the `posts` connection resolver.
 *
 * @param cursorValue - The cursor value to be parsed.
 * @param cursorName - The name of the cursor argument.
 * @param cursorPath - The path of the cursor argument in the GraphQL query.
 * @param organization - The ID of the organization to which the posts belong.
 * @returns An object containing the parsed cursor value or an array of errors if the cursor is invalid.
 *
 * @see Post - The Post model used to interact with the posts collection in the database.
 * @see ParseGraphQLConnectionCursorArguments - The type definition for the arguments of the parseCursor function.
 * @see ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.
 *
 */
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
  organization,
}: ParseGraphQLConnectionCursorArguments & {
  organization: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const post = await Post.findOne({
    _id: cursorValue,
    organization,
  });
  if (!post) {
    errors.push({
      message: `Argument ${cursorName} is an invalid cursor.`,
      path: cursorPath,
    });
  }
  if (errors.length !== 0) {
    return {
      errors,
      isSuccessful: false,
    };
  }

  return {
    isSuccessful: true,
    parsedCursor: cursorValue,
  };
};
