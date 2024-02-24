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
import type { ParseGraphQLConnectionSortedBy } from "./parseGraphQLConnectionArgumentsWithSortedBy";
import type { ParseGraphQLConnectionWhere } from "./parseGraphQLConnectionArgumentsWithWhere";

/**
This is typescript type of the object containing validated and transformed connection
arguments passed to `parseGraphQLConnectionArgumentsWithSortedByAndWhere` function.
*/
export type ParsedGraphQLConnectionArgumentsWithSortedByAndWhere<T0, T1, T2> = {
  filter: T1;
  sort: T2;
} & ParsedGraphQLConnectionArguments<T0>;

/**
  This is typescript type of the object returned from `parseGraphQLConnectionArgumentsWithSortedByAndWhere` function.
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
  This function is used for validating and transforming arguments for a custom graphQL
  connection that also provides filtering and sorting capabilities.
  */
export async function parseGraphQLConnectionArgumentsWithSortedByAndWhere<
  T0,
  T1,
  T2,
>({
  args,
  maximumLimit = MAXIMUM_FETCH_LIMIT,
  parseCursor,
  parseWhere,
  parseSortedBy,
}: {
  args: DefaultGraphQLConnectionArguments;
  maximumLimit?: number;
  parseCursor: ParseGraphQLConnectionCursor<T0>;
  parseWhere: ParseGraphQLConnectionWhere<T1>;
  parseSortedBy: ParseGraphQLConnectionSortedBy<T2>;
}): ParseGraphQLConnectionArgumentsWithSortedByAndWhereResult<T0, T1, T2> {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor,
      maximumLimit,
    });
  const parseWhereResult = parseWhere();
  const parseSortedByResult = parseSortedBy();

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
