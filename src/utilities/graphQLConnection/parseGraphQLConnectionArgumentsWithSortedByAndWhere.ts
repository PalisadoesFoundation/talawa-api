import type {
  DefaultGraphQLArgumentError,
  DefaultGraphQLConnectionArguments,
} from "./index";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import {
  type ParseGraphQLConnectionCursor,
  type ParsedGraphQLConnectionArguments,
  parseGraphQLConnectionArguments,
} from "./parseGraphQLConnectionArguments";
import type { ParseGraphQLConnectionSortedByResult } from "./parseGraphQLConnectionArgumentsWithSortedBy";
import type { ParseGraphQLConnectionWhereResult } from "./parseGraphQLConnectionArgumentsWithWhere";
/**
 * This is typescript type of the object containing validated and transformed connection
 * arguments passed to `parseGraphQLConnectionArgumentsWithSortedByAndWhere` function.
 */
export type ParsedGraphQLConnectionArgumentsWithSortedByAndWhere<T0, T1, T2> = {
  filter: T1;
  sort: T2;
} & ParsedGraphQLConnectionArguments<T0>;

/**
 * This is typescript type of the object returned from `parseGraphQLConnectionArgumentsWithSortedByAndWhere` function.
 */
export type ParseGraphQLConnectionArgumentsWithSortedByAndWhereResult<
  T0,
  T1,
  T2,
> = Promise<
  | {
      errors: DefaultGraphQLArgumentError[];
      isSuccessful: false;
    }
  | {
      isSuccessful: true;
      parsedArgs: ParsedGraphQLConnectionArgumentsWithSortedByAndWhere<
        T0,
        T1,
        T2
      >;
    }
>;

/**
 * This function is used for validating and transforming arguments for a custom graphQL
 * connection that also provides filtering and sorting capabilities.
 * @example
 * const result = await parseGraphQLConnectionArgumentsWithSortedBy(\{
 *   args: \{
 *     after,
 *     first,
 *   \},
 *   maximumLimit: 20,
 *   parseCursor,
 *   parseSortedBy,
 *   parseWhere,
 * \})
 * if (result.isSuccessful === false) \{
 *    throw new GraphQLError("Invalid arguments provided.", \{
 *      extensions: \{
 *        code: "INVALID_ARGUMENTS",
 *        errors: result.errors
 *      \}
 *   \})
 * \}
 * const \{ parsedArgs: \{ cursor, direction, filter, limit, sort \} \} = result;
 */
export async function parseGraphQLConnectionArgumentsWithSortedByAndWhere<
  T0,
  T1,
  T2,
>({
  args,
  maximumLimit = MAXIMUM_FETCH_LIMIT,
  parseCursor,
  parseWhereResult,
  parseSortedByResult,
}: {
  args: DefaultGraphQLConnectionArguments;
  maximumLimit?: number;
  parseCursor: ParseGraphQLConnectionCursor<T0>;
  parseWhereResult: ParseGraphQLConnectionWhereResult<T1>;
  parseSortedByResult: ParseGraphQLConnectionSortedByResult<T2>;
}): ParseGraphQLConnectionArgumentsWithSortedByAndWhereResult<T0, T1, T2> {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor,
      maximumLimit,
    });

  if (!parseGraphQLConnectionArgumentsResult.isSuccessful) {
    if (!parseWhereResult.isSuccessful) {
      if (!parseSortedByResult.isSuccessful) {
        return {
          errors: parseGraphQLConnectionArgumentsResult.errors.concat(
            parseWhereResult.errors.concat(parseSortedByResult.errors),
          ),
          isSuccessful: false,
        };
      } else {
        return {
          errors: parseGraphQLConnectionArgumentsResult.errors.concat(
            parseWhereResult.errors,
          ),
          isSuccessful: false,
        };
      }
    } else {
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
    }
  } else if (!parseWhereResult.isSuccessful) {
    if (!parseSortedByResult.isSuccessful) {
      return {
        errors: parseWhereResult.errors.concat(parseSortedByResult.errors),
        isSuccessful: false,
      };
    } else {
      return {
        errors: parseWhereResult.errors,
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
      filter: parseWhereResult.parsedWhere,
      limit: parseGraphQLConnectionArgumentsResult.parsedArgs.limit,
      sort: parseSortedByResult.parsedSortedBy,
    },
  };
}
