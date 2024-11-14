import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
import {
  parseGraphQLConnectionArgumentsWithSortedByAndWhere,
  transformToDefaultGraphQLConnection,
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
} from "../../utilities/graphQLConnection";
import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import type { Types } from "mongoose";
import {
  getUserTagGraphQLConnectionFilter,
  getUserTagGraphQLConnectionSort,
  parseUserTagSortedBy,
  parseUserTagWhere,
} from "../../utilities/userTagsPaginationUtils";

/**
 * Resolver function for the `childTags` field of a `UserTag`.
 *
 * This resolver is used to resolve the `childTags` field of a `UserTag` type.
 *
 * @param parent - The parent object representing the user tag. It contains information about the user tag, including the ID of the user tag.
 * @param args - The arguments provided to the field. These arguments are used to filter, sort, and paginate the child tags.
 * @returns A promise that resolves to a connection object containing the child tags of the user tag.
 *
 * @see OrganizationTagUser - The OrganizationTagUser model used to interact with the organization tag users collection in the database.
 * @see parseGraphQLConnectionArguments - The function used to parse the GraphQL connection arguments (filter, sort, pagination).
 * @see transformToDefaultGraphQLConnection - The function used to transform the list of child tags into a connection object.
 * @see getGraphQLConnectionFilter - The function used to get the common filter object for the GraphQL connection.
 * @see getGraphQLConnectionSort - The function used to get the common sort object for the GraphQL connection.
 * @see MAXIMUM_FETCH_LIMIT - The maximum number of child tags that can be fetched in a single request.
 * @see GraphQLError - The error class used to throw GraphQL errors.
 * @see UserTagResolvers - The type definition for the resolvers of the UserTag fields.
 *
 */
export const childTags: UserTagResolvers["childTags"] = async (
  parent,
  args,
) => {
  const parseWhereResult = parseUserTagWhere(args.where);
  const parseSortedByResult = parseUserTagSortedBy(args.sortedBy);

  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args,
      parseSortedByResult,
      parseWhereResult,
      parseCursor: /* c8 ignore start */ (args) =>
        parseCursor({
          ...args,
          parentTagId: parent._id,
        }),
      /* c8 ignore stop */
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

  const objectListFilter = getUserTagGraphQLConnectionFilter({
    cursor: parsedArgs.cursor,
    direction: parsedArgs.direction,
    sortById: parsedArgs.sort.sortById,
    nameStartsWith: parsedArgs.filter.nameStartsWith,
  });

  // don't use _id as a filter in while counting the documents
  // _id is only used for pagination
  const totalCountFilter = Object.fromEntries(
    Object.entries(objectListFilter).filter(([key]) => key !== "_id"),
  );

  const sort = getUserTagGraphQLConnectionSort({
    direction: parsedArgs.direction,
    sortById: parsedArgs.sort.sortById,
  });

  const [objectList, totalCount] = await Promise.all([
    OrganizationTagUser.find({
      ...objectListFilter,
      parentTagId: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .lean()
      .exec(),
    OrganizationTagUser.find({
      ...totalCountFilter,
      parentTagId: parent._id,
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

/*
This function is used to validate and transform the cursor passed to this connnection
resolver.
*/
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
  parentTagId,
}: ParseGraphQLConnectionCursorArguments & {
  parentTagId: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const tag = await OrganizationTagUser.findOne({
    _id: cursorValue,
    parentTagId,
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
