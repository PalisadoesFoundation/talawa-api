import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import type {
  DefaultGraphQLArgumentError,
  DefaultGraphQLConnectionArguments,
} from "./index";
import {
  type ParseGraphQLConnectionCursor,
  type ParsedGraphQLConnectionArguments,
  parseGraphQLConnectionArguments,
} from "./parseGraphQLConnectionArguments";

/**
 *This is typescript type of the object returned from callback function `parseSortedBy`.
 */
export type ParseGraphQLConnectionSortedByResult<T0> =
  | {
      isSuccessful: false;
      errors: DefaultGraphQLArgumentError[];
    }
  | {
      isSuccessful: true;
      parsedSortedBy: T0;
    };

/**
 * This is typescript type of the object containing validated and transformed connection
 * arguments passed to `parseGraphQLConnectionArgumentsWithSortedBy` function.
 */
export type ParsedGraphQLConnectionArgumentsWithSortedBy<T0, T1> = {
  sort: T1;
} & ParsedGraphQLConnectionArguments<T0>;

/**
 * This is typescript type of the object returned from `parseGraphQLConnectionArgumentsWithSortedBy` function.
 */
export type ParseGraphQLConnectionArgumentsWithSortedByResult<T0, T1> = Promise<
  | {
      errors: DefaultGraphQLArgumentError[];
      isSuccessful: false;
    }
  | {
      isSuccessful: true;
      parsedArgs: ParsedGraphQLConnectionArgumentsWithSortedBy<T0, T1>;
    }
>;

/**
 * This function is used for validating and transforming arguments for a graphQL connection that
 * also provides sorting capabilities.
 * @example
 * const result = await parseGraphQLConnectionArgumentsWithSortedBy(\{
 *   args: \{
 *     after,
 *     first,
 *   \},
 *   maximumLimit: 20,
 *   parseCursor,
 *   parseSortedBy,
 * \})
 * if (result.isSuccessful === false) \{
 *    throw new GraphQLError("Invalid arguments provided.", \{
 *      extensions: \{
 *        code: "INVALID_ARGUMENTS",
 *        errors: result.errors
 *      \}
 *   \})
 * \}
 * const \{ parsedArgs: \{ cursor, direction, limit, sort \} \} = result;
 */
export async function parseGraphQLConnectionArgumentsWithSortedBy<T0, T1>({
  args,
  maximumLimit = MAXIMUM_FETCH_LIMIT,
  parseCursor,
  parseSortedByResult,
}: {
  args: DefaultGraphQLConnectionArguments;
  maximumLimit?: number;
  parseCursor: ParseGraphQLConnectionCursor<T0>;
  parseSortedByResult: ParseGraphQLConnectionSortedByResult<T1>;
}): ParseGraphQLConnectionArgumentsWithSortedByResult<T0, T1> {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor,
      maximumLimit,
    });

  if (!parseGraphQLConnectionArgumentsResult.isSuccessful) {
    if (!parseSortedByResult.isSuccessful) {
      return {
        errors: parseGraphQLConnectionArgumentsResult.errors.concat(
          parseSortedByResult.errors,
        ),
        isSuccessful: false,
      };
    } else {
      return {
        errors: parseGraphQLConnectionArgumentsResult.errors,
        isSuccessful: false,
      };
    }
  } else if (!parseSortedByResult.isSuccessful) {
    return {
      errors: parseSortedByResult.errors,
      isSuccessful: false,
    };
  }

  return {
    isSuccessful: true,
    parsedArgs: {
      cursor: parseGraphQLConnectionArgumentsResult.parsedArgs.cursor,
      direction: parseGraphQLConnectionArgumentsResult.parsedArgs.direction,
      limit: parseGraphQLConnectionArgumentsResult.parsedArgs.limit,
      sort: parseSortedByResult.parsedSortedBy,
    },
  };
}
