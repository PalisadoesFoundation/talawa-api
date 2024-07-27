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

/**
 * Resolver function for the `usersAssignedTo` field of a `UserTag`.
 *
 * This resolver is used to resolve the `usersAssignedTo` field of a `UserTag` type.
 *
 * @param parent - The parent object representing the user tag. It contains information about the user tag, including the ID of the user tag.
 * @param args - The arguments provided to the field. These arguments are used to filter, sort, and paginate the users assigned to the user tag.
 * @returns A promise that resolves to a connection object containing the users assigned to the user tag.
 *
 * @see TagUser - The TagUser model used to interact with the tag users collection in the database.
 * @see parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 * @see transformToDefaultGraphQLConnection - The function used to transform the list of users assigned to the user tag into a connection object.
 * @see getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 * @see getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 * @see MAXIMUM_FETCH_LIMIT - The maximum number of users that can be fetched in a single request.
 * @see GraphQLError - The error class used to throw GraphQL errors.
 * @see UserTagResolvers - The type definition for the resolvers of the UserTag fields.
 *
 */
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

/**
 * Parses the cursor value for the `usersAssignedTo` connection resolver.
 *
 * This function is used to parse the cursor value provided to the `usersAssignedTo` connection resolver.
 *
 * @param cursorValue - The cursor value to be parsed.
 * @param cursorName - The name of the cursor argument.
 * @param cursorPath - The path of the cursor argument in the GraphQL query.
 * @param tagId - The ID of the user tag to which the users are assigned.
 * @returns An object containing the parsed cursor value or an array of errors if the cursor value is invalid.
 *
 * @see TagUser - The TagUser model used to interact with the tag users collection in the database.
 * @see DefaultGraphQLArgumentError - The type definition for the default GraphQL argument error.
 * @see ParseGraphQLConnectionCursorArguments - The type definition for the arguments provided to the parseCursor function.
 * @see ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.
 *
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
