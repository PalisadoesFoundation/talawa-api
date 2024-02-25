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

/**
 * This is typescript type of the object returned from callback function `parseWhere`.
 */
export type ParseGraphQLConnectionWhereResult<T0> =
  | {
      isSuccessful: false;
      errors: DefaultGraphQLArgumentError[];
    }
  | {
      isSuccessful: true;
      parsedWhere: T0;
    };

/**
 * This is typescript type of the object containing the validated and transformed connection
 * arguments passed to `parseGraphQLConnectionArgumentsWithWhere` function.
 */
export type ParsedGraphQLConnectionArgumentsWithWhere<T0, T1> = {
  where: T1;
} & ParsedGraphQLConnectionArguments<T0>;

/**
 * This is typescript type of the object returned from `parseGraphQLConnectionArgumentsWithWhere` function.
 */
export type ParseGraphQLConnectionArgumentsWithWhereResult<T0, T1> = Promise<
  | {
      errors: DefaultGraphQLArgumentError[];
      isSuccessful: false;
    }
  | {
      isSuccessful: true;
      parsedArgs: ParsedGraphQLConnectionArgumentsWithWhere<T0, T1>;
    }
>;

/**
 * This function handles validating and transforming arguments for a custom graphQL connection
 * that also provides filtering capabilities.
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
 * const \{ parsedArgs: \{ cursor, direction, filter, limit \} \} = result;
 */
export async function parseGraphQLConnectionArgumentsWithWhere<T0, T1>({
  args,
  maximumLimit = MAXIMUM_FETCH_LIMIT,
  parseCursor,
  parseWhereResult,
}: {
  args: DefaultGraphQLConnectionArguments;
  maximumLimit?: number;
  parseCursor: ParseGraphQLConnectionCursor<T0>;
  parseWhereResult: ParseGraphQLConnectionWhereResult<T1>;
}): ParseGraphQLConnectionArgumentsWithWhereResult<T0, T1> {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      maximumLimit,
      parseCursor,
    });

  if (!parseGraphQLConnectionArgumentsResult.isSuccessful) {
    if (!parseWhereResult.isSuccessful) {
      return {
        errors: parseGraphQLConnectionArgumentsResult.errors.concat(
          parseWhereResult.errors,
        ),
        isSuccessful: false,
      };
    } else {
      return {
        errors: parseGraphQLConnectionArgumentsResult.errors,
        isSuccessful: false,
      };
    }
  } else if (!parseWhereResult.isSuccessful) {
    return {
      errors: parseWhereResult.errors,
      isSuccessful: false,
    };
  }

  return {
    isSuccessful: true,
    parsedArgs: {
      cursor: parseGraphQLConnectionArgumentsResult.parsedArgs.cursor,
      direction: parseGraphQLConnectionArgumentsResult.parsedArgs.direction,
      limit: parseGraphQLConnectionArgumentsResult.parsedArgs.limit,
      where: parseWhereResult.parsedWhere,
    },
  };
}
