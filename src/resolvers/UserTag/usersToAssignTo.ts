import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import type {
  DefaultGraphQLArgumentError,
  GraphQLConnectionTraversalDirection,
  ParseGraphQLConnectionCursorArguments,
  ParseGraphQLConnectionCursorResult,
} from "../../utilities/graphQLConnection";

import {
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
} from "../../utilities/graphQLConnection";

import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import { Types } from "mongoose";

/**
 * Resolver function for the `usersToAssignTo` field of a `UserTag`.
 *
 * @param parent - The parent object representing the user tag. It contains information about the user tag, including the ID of the user tag.
 * @param args - The arguments provided to the field. These arguments are used to filter, sort, and paginate the users assigned to the user tag.
 * @returns A promise that resolves to a connection object containing the users assigned to the user tag.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 * @see transformToDefaultGraphQLConnection - The function used to transform the list of users assigned to the user tag into a connection object.
 * @see getGraphQLConnectionFilter - The function used to get the filter object for the GraphQL connection.
 * @see getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 * @see MAXIMUM_FETCH_LIMIT - The maximum number of users that can be fetched in a single request.
 * @see GraphQLError - The error class used to throw GraphQL errors.
 * @see UserResolvers - The type definition for the resolvers of the UserTag fields.
 *
 */
export const usersToAssignTo: UserTagResolvers["usersToAssignTo"] = async (
  parent,
  args,
) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
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

  const filter = getGraphQLConnectionFilter({
    cursor: parsedArgs.cursor,
    direction: parsedArgs.direction,
  });

  const sort = getCommonGraphQLConnectionSort({
    direction: parsedArgs.direction,
  });

  const commonPipeline = [
    // Step 1: Match users whose joinedOrgs contains the orgId
    {
      $match: {
        ...filter,
        joinedOrganizations: parent.organizationId,
      },
    },
    // Step 2: Perform a left join with TagUser collection on userId
    {
      $lookup: {
        from: "tagusers", // Name of the collection holding TagUser documents
        localField: "_id",
        foreignField: "userId",
        as: "tagUsers",
      },
    },
    // Step 3: Filter out users that have a tagUser document with the specified tagId
    {
      $match: {
        tagUsers: {
          $not: {
            $elemMatch: { tagId: parent._id },
          },
        },
      },
    },
  ];

  // Execute the queries using the common pipeline
  const [objectList, totalCountResult] = await Promise.all([
    // First aggregation to get the user list
    User.aggregate([
      ...commonPipeline,
      {
        $sort: { ...sort },
      },
      { $limit: parsedArgs.limit },
    ]),
    // Second aggregation to count total users
    User.aggregate([...commonPipeline, { $count: "totalCount" }]),
  ]);

  const totalCount =
    totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

  // The users and totalCount are now ready for use

  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfaceUser,
    InterfaceUser
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
 * Parses the cursor value for the `usersToAssignTo` connection resolver.
 *
 * This function is used to parse the cursor value provided to the `usersToAssignTo` connection resolver.
 *
 * @param cursorValue - The cursor value to be parsed.
 * @param cursorName - The name of the cursor argument.
 * @param cursorPath - The path of the cursor argument in the GraphQL query.
 * @returns An object containing the parsed cursor value or an array of errors if the cursor value is invalid.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see DefaultGraphQLArgumentError - The type definition for the default GraphQL argument error.
 * @see ParseGraphQLConnectionCursorArguments - The type definition for the arguments provided to the parseCursor function.
 * @see ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.
 *
 */
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
}: ParseGraphQLConnectionCursorArguments): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const user = await User.findOne({
    _id: cursorValue,
  });

  if (!user) {
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

type GraphQLConnectionFilter =
  | {
      _id: {
        $lt: Types.ObjectId;
      };
    }
  | {
      _id: {
        $gt: Types.ObjectId;
      };
    }
  | Record<string, never>;

export const getGraphQLConnectionFilter = ({
  cursor,
  direction,
}: {
  cursor: string | null;
  direction: GraphQLConnectionTraversalDirection;
}): GraphQLConnectionFilter => {
  if (cursor !== null) {
    if (direction === "BACKWARD") {
      return {
        _id: {
          $gt: new Types.ObjectId(cursor),
        },
      };
    } else {
      return {
        _id: {
          $lt: new Types.ObjectId(cursor),
        },
      };
    }
  } else {
    return {};
  }
};
