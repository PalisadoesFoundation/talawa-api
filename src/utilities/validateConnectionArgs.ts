import { GraphQLError } from "graphql";

export function isNotNullish<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export type RelayConnectionArguments = {
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
};

export type ParsedRelayConnectionArguments = {
  cursor: string | null;
  limit: number;
  direction: "FORWARD" | "BACKWARD";
};

// some global or database record based hard limit for the number of records
// that can be returned in one connection query for the corresponding record
// replace this with an environment variable preferably
const env = {
  LIMIT: 50,
};

export function parseConnectionArguments(
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
    if (args.first > env.LIMIT) {
      throw new GraphQLError(
        `Argument first cannot not be greater than ${env.LIMIT}.`
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
    if (args.last > env.LIMIT) {
      throw new GraphQLError(
        `Argument last cannot be greater than ${env.LIMIT}.`
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
