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
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver.
 * @returns An object containing an array of posts,totalCount of post and pagination information.
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

/*
This function is used to validate and transform the cursor passed to this connnection
resolver.
*/
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
    if (errors.length !== 0) {
      return {
        errors,
        isSuccessful: false,
      };
    }
  }

  return {
    isSuccessful: true,
    parsedCursor: cursorValue,
  };
};
