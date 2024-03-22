// import  {  Post } from "../../models";
import type { Types } from "mongoose";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";
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
 * Resolver function to fetch and return posts created by a user from the database.
 * This function implements cursor-based pagination using GraphQL connection arguments.
 *
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver. These should include pagination arguments such as `first`, `last`, `before`, and `after`.
 *
 * @returns A Promise that resolves to an object containing an array of posts, the total count of posts, and pagination information. The pagination information includes the `startCursor`, `endCursor`, `hasPreviousPage`, and `hasNextPage`.
 *
 * @throws GraphQLError Throws an error if the provided arguments are invalid.
 */
export const posts: UserResolvers["posts"] = async (parent, args) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
          creatorId: parent._id,
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
      creatorId: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .lean()
      .exec(),

    Post.find({
      creatorId: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);
  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfacePost,
    InterfacePost
  >({
    objectList,
    parsedArgs,
    totalCount,
  });
};
/*
This is typescript type of the parsed cursor for this connection resolver.
*/
type ParsedCursor = string;

/**
 * This function is used to validate and transform the cursor passed to the `posts` connection resolver.
 *
 * @param args - An object that includes the cursor value, cursor name, cursor path, and the ID of the creator.
 *
 * @returns A Promise that resolves to an object that includes a boolean indicating whether the operation was successful, and the parsed cursor value. If the operation was not successful, the object also includes an array of errors.
 *
 * @throws Error Throws an error if the provided cursor is invalid.
 * */
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
  creatorId,
}: ParseGraphQLConnectionCursorArguments & {
  creatorId: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const post = await Post.findOne({
    _id: cursorValue,
    creatorId,
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
