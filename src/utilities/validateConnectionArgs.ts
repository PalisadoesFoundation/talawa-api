import { GraphQLError } from "graphql";

/**
 * Checks if a value is not null or undefined.
 * @param value - The value to check.
 * @returns True if the value is not null or undefined, otherwise false.
 */
export function isNotNullish<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Represents the arguments for Relay-style pagination.
 */
export type RelayConnectionArguments = {
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
  limit: number;
};

/**
 * Represents the parsed arguments for Relay-style pagination.
 */
export type ParsedRelayConnectionArguments = {
  cursor: string | null;
  limit: number;
  direction: "FORWARD" | "BACKWARD";
};

/**
 * Parses Relay-style connection arguments and returns them in a parsed format.
 * @param args - The Relay-style connection arguments to parse.
 * @returns Parsed connection arguments.
 * @throws GraphQLError If the arguments are invalid.
 */
export function parseRelayConnectionArguments(
  args: RelayConnectionArguments
): ParsedRelayConnectionArguments {
  const paginationArgs: ParsedRelayConnectionArguments = {
    cursor: null,
    direction: "FORWARD",
    limit: 0,
  };

  if (isNotNullish(args.first)) {
    if (isNotNullish(args.last)) {
      throw new GraphQLError(
        "Argument first cannot be provided with argument last."
      );
    }
    if (isNotNullish(args.before)) {
      throw new GraphQLError(
        "Argument before cannot be provided with argument first."
      );
    }
    if (args.first > args.limit) {
      throw new GraphQLError(
        `Argument first cannot not be greater than ${args.after}.`
      );
    }
    paginationArgs.direction = "FORWARD";
    paginationArgs.limit = args.first;
    if (isNotNullish(args.after)) {
      paginationArgs.cursor = args.after;
    }
  } else if (isNotNullish(args.last)) {
    if (isNotNullish(args.after)) {
      throw new GraphQLError(
        "Argument after cannot be provided with argument last."
      );
    }
    if (args.last > args.limit) {
      throw new GraphQLError(
        `Argument last cannot be greater than ${args.limit}.`
      );
    }
    paginationArgs.direction = "BACKWARD";
    paginationArgs.limit = args.last;
    if (isNotNullish(args.before)) {
      paginationArgs.cursor = args.before;
    }
  } else {
    throw new GraphQLError(
      `Either argument first or argument last must be provided.`
    );
  }

  return paginationArgs;
}
