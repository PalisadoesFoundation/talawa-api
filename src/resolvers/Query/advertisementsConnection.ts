import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import type { InterfaceAdvertisement } from "../../models";
import { Advertisement } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import {
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
} from "../../utilities/graphQLConnection";

/**
 * Retrieves a paginated list of advertisements based on the provided connection arguments.
 *
 * This function handles querying and pagination of advertisements using connection arguments. It performs validation of the connection arguments, applies filters and sorting, and then returns a paginated result containing the advertisements. The media URLs for each advertisement are adjusted based on the API root URL provided in the context.
 *
 * @param _parent - This parameter represents the parent resolver in the GraphQL schema and is not used in this function.
 * @param args - The arguments passed to the GraphQL query, including pagination and filter criteria.
 * @param context - Provides contextual information, including the API root URL. This is used to construct the media URLs for the advertisements.
 *
 * @returns A paginated connection object containing the advertisements, their total count, and the pagination information.
 *
 */
export const advertisementsConnection: QueryResolvers["advertisementsConnection"] =
  async (_parent, args, context) => {
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

    const filter = getCommonGraphQLConnectionFilter({
      cursor: parsedArgs.cursor,
      direction: parsedArgs.direction,
    });

    const sort = getCommonGraphQLConnectionSort({
      direction: parsedArgs.direction,
    });

    const [objectList, totalCount] = await Promise.all([
      Advertisement.find({
        ...filter,
      })
        .sort(sort)
        .limit(parsedArgs.limit)
        .lean()
        .exec(),
      Advertisement.find().countDocuments().exec(),
    ]);

    const advertisements = objectList.map(
      (advertisement: InterfaceAdvertisement) => ({
        ...advertisement,
        mediaUrl: `${context.apiRootUrl}${advertisement.mediaUrl}`,
      }),
    );

    return transformToDefaultGraphQLConnection<
      ParsedCursor,
      InterfaceAdvertisement,
      InterfaceAdvertisement
    >({
      objectList: advertisements,
      parsedArgs,
      totalCount,
    });
  };

/**
 * Type representing the parsed cursor used in the connection resolver.
 */
type ParsedCursor = string;

/**
 * Validates and transforms the cursor passed to the connection resolver.
 *
 * This function checks if the provided cursor value corresponds to a valid advertisement in the database. If the cursor is valid, it is returned as-is. Otherwise, an error is recorded.
 *
 * @param cursorValue - The value of the cursor to be validated.
 * @param cursorName - The name of the cursor argument used in the query.
 * @param cursorPath - The path in the query where the cursor argument is located.
 *
 * @returns An object containing a flag indicating success or failure, the parsed cursor, and any errors encountered during validation.
 */
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
}: ParseGraphQLConnectionCursorArguments): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const advertisement = await Advertisement.findOne({
    _id: cursorValue,
  });

  if (!advertisement) {
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
