import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceTagUser, InterfaceUser } from "../../models";
import { TagUser } from "../../models";
import {
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
} from "../../utilities/graphQLConnection";
import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import type { Types } from "mongoose";

export const usersAssignedTo: UserTagResolvers["usersAssignedTo"] = async (
  parent,
  args,
) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
          tagId: parent._id,
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

  const sort = getCommonGraphQLConnectionSort({
    direction: parsedArgs.direction,
  });

  const [objectList, totalCount] = await Promise.all([
    TagUser.find({
      ...filter,
      tagId: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .populate("userId")
      .lean()
      .exec(),

    TagUser.find({
      tagId: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);

  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfaceTagUser,
    InterfaceUser
  >({
    createNode: (object) => {
      return object.userId as InterfaceUser;
    },
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
  tagId,
}: ParseGraphQLConnectionCursorArguments & {
  tagId: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const tagUser = await TagUser.findOne({
    _id: cursorValue,
    tagId,
  });

  if (!tagUser) {
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
