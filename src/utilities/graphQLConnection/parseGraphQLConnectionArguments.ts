import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import {
  type DefaultGraphQLArgumentError,
  type DefaultGraphQLConnectionArguments,
  type GraphQLConnectionTraversalDirection,
  isNotNullish,
} from "./index";

/**
 *This is typescript type of the single object callback function `parseCursor` takes in as
 * an argument.
 */
export type ParseGraphQLConnectionCursorArguments = {
  cursorName: "after" | "before";
  cursorPath: string[];
  cursorValue: string;
};

/**
 * This is typescript type of object returned from the callback function `parseCursor` passed
 * as an argument to `parseGraphQLConnectionArguments`, `parseGraphQLConnectionArgumentsWithSortedBy`,
 * `parseGraphQLConnectionArgumentsWithWhere` and `parseGraphQLConnectionArgumentsWithSortedByAndWhere`
 * functions.
 */
export type ParseGraphQLConnectionCursorResult<T0> = Promise<
  | {
      errors: DefaultGraphQLArgumentError[];
      isSuccessful: false;
    }
  | {
      isSuccessful: true;
      parsedCursor: T0;
    }
>;

/**
 * This is typescript type of the callback function `parseCursor`.
 */
export type ParseGraphQLConnectionCursor<T0> = (
  args: ParseGraphQLConnectionCursorArguments,
) => ParseGraphQLConnectionCursorResult<T0>;

/**
 * This is typescript type of the object containing the validated and transformed connection
 * arguments passed to `parseGraphQLConnectionArguments` function.
 */
export type ParsedGraphQLConnectionArguments<T0> = {
  cursor: T0 | null;
  direction: GraphQLConnectionTraversalDirection;
  limit: number;
};

/**
 * This is typescript type of the object returned from `parseGraphQLConnectionArguments`
 * function.
 */
export type ParseGraphQLConnectionArgumentsResult<T0> =
  | {
      errors: DefaultGraphQLArgumentError[];
      isSuccessful: false;
    }
  | {
      isSuccessful: true;
      parsedArgs: ParsedGraphQLConnectionArguments<T0>;
    };

/**
 * This function handles validating and transforming arguments of a base graphQL connection.
 * @example
 * const result = await parseGraphQLConnectionArguments(\{
 *   args: \{
 *     after,
 *     first,
 *   \},
 *   maximumLimit: 20,
 *   parseCursor
 * \})
 * if (result.isSuccessful === false) \{
 *    throw new GraphQLError("Invalid arguments provided.", \{
 *      extensions: \{
 *        code: "INVALID_ARGUMENTS",
 *        errors: result.errors
 *      \}
 *   \})
 * \}
 * const \{ parsedArgs: \{ cursor, direction, limit \} \} = result;
 */
export async function parseGraphQLConnectionArguments<T0>({
  args,
  maximumLimit = MAXIMUM_FETCH_LIMIT,
  parseCursor,
}: {
  args: DefaultGraphQLConnectionArguments;
  maximumLimit?: number;
  parseCursor: ParseGraphQLConnectionCursor<T0>;
}): Promise<ParseGraphQLConnectionArgumentsResult<T0>> {
  const { after, before, first, last } = args;
  let errors: DefaultGraphQLArgumentError[] = [];
  const parsedArgs: ParsedGraphQLConnectionArguments<T0> = {
    cursor: null,
    direction: "FORWARD",
    limit: 0,
  };
  if (isNotNullish(first)) {
    if (isNotNullish(last)) {
      errors.push({
        message: "Argument last cannot be provided with argument first.",
        path: ["last"],
      });
    }
    if (isNotNullish(before)) {
      errors.push({
        message: "Argument before cannot be provided with argument first.",
        path: ["before"],
      });
    }
    if (first > maximumLimit) {
      errors.push({
        message: `Argument first cannot be greater than ${maximumLimit}.`,
        path: ["first"],
      });
    }
    parsedArgs.direction = "FORWARD";
    // The limit is increased by `1` to fetch one additional object that will be used to
    // inform the client about existence of at least one more connection edge to be traversed
    // in the connection, depending on the connection traversal direction this information
    // is conveyed using the `hasNextPage` or `hasPreviousPage` booleans present in the
    // pageInfo object of the connection.
    parsedArgs.limit = first + 1;
    if (isNotNullish(after)) {
      const result = await parseCursor({
        cursorName: "after",
        cursorPath: ["after"],
        cursorValue: after,
      });
      if (!result.isSuccessful) {
        errors = errors.concat(result.errors);
      } else {
        parsedArgs.cursor = result.parsedCursor;
      }
    }
  } else if (isNotNullish(last)) {
    if (isNotNullish(after)) {
      errors.push({
        message: "Argument after cannot be provided with argument last.",
        path: ["after"],
      });
    }
    if (last > maximumLimit) {
      errors.push({
        message: `Argument last cannot be greater than ${maximumLimit}.`,
        path: ["last"],
      });
    }
    parsedArgs.direction = "BACKWARD";
    // The limit is increased by `1` to fetch one additional object that will be used to
    // inform the client about existence of at least one more connection edge to be traversed
    // in the connection, depending on the connection traversal direction this information
    // is conveyed using the `hasNextPage` or `hasPreviousPage` booleans present in the
    // pageInfo object of the connection.
    parsedArgs.limit = last + 1;
    if (isNotNullish(before)) {
      const result = await parseCursor({
        cursorName: "before",
        cursorPath: ["before"],
        cursorValue: before,
      });
      if (!result.isSuccessful) {
        errors = errors.concat(result.errors);
      } else {
        parsedArgs.cursor = result.parsedCursor;
      }
    }
  } else {
    errors.push({
      message: `Argument first was not provided.`,
      path: ["first"],
    });
    errors.push({
      message: `Argument last was not provided.`,
      path: ["last"],
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
    parsedArgs,
  };
}
