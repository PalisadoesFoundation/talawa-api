import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
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
import type { Types } from "mongoose";

/**
 * Resolver function for the `userTags` field of an `Organization`.
 *
 * This resolver is used to resolve the `userTags` field of an `Organization` type.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the organization.
 * @param args - The arguments provided to the field. These arguments are used to filter, sort, and paginate the user tags.
 * @returns A promise that resolves to a connection object containing the user tags of the organization.
 *
 * @see OrganizationTagUser - The OrganizationTagUser model used to interact with the user tags collection in the database.
 * @see parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 * @see transformToDefaultGraphQLConnection - The function used to transform the list of user tags into a connection object.
 * @see getCommonGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 * @see getCommonGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 * @see MAXIMUM_FETCH_LIMIT - The maximum number of user tags that can be fetched in a single request.
 * @see GraphQLError - The error class used to throw GraphQL errors.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const userTags: OrganizationResolvers["userTags"] = async (
  parent,
  args,
) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
          organizationId: parent._id,
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
    OrganizationTagUser.find({
      ...filter,
      organizationId: parent._id,
      parentTagId: null,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .lean()
      .exec(),
    OrganizationTagUser.find({
      organizationId: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);

  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfaceOrganizationTagUser,
    InterfaceOrganizationTagUser
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
 * Parses the cursor value for the `userTags` connection resolver.
 *
 * This function is used to parse the cursor value for the `userTags` connection resolver.
 *
 * @param cursorValue - The cursor value to be parsed.
 * @param cursorName - The name of the cursor argument.
 * @param cursorPath - The path of the cursor argument in the query.
 * @param organizationId - The ID of the organization to which the user tags belong.
 * @returns An object containing the parsed cursor value or an array of errors if the cursor is invalid.
 *
 * @see OrganizationTagUser - The OrganizationTagUser model used to interact with the user tags collection in the database.
 * @see DefaultGraphQLArgumentError - The type definition for the default GraphQL argument error.
 * @see ParseGraphQLConnectionCursorArguments - The type definition for the arguments of the parseCursor function.
 * @see ParseGraphQLConnectionCursorResult - The type definition for the result of the parseCursor function.
 *
 */
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
  organizationId,
}: ParseGraphQLConnectionCursorArguments & {
  organizationId: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const tag = await OrganizationTagUser.findOne({
    _id: cursorValue,
    organizationId,
  });

  if (!tag) {
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
