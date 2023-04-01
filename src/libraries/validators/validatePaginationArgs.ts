import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import {
  InputMaybe,
  PaginationError,
  Scalars,
} from "../../types/generatedGraphQLTypes";

export type CursorPaginationArgsType = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["PositiveInt"]>;
  last?: InputMaybe<Scalars["PositiveInt"]>;
};

export const validatePaginationArgs = (args: CursorPaginationArgsType) => {
  const paginationErrors: PaginationError[] = [];

  // Check that one of first or last must be provided
  if (!args.first && !args.last) {
    paginationErrors.push({
      __typename: "MissingArguments",
      message:
        "Either first or last argument must be provided in the pagination arguments.",
      path: "first,last",
    });
  }

  // Check that both first and last must not be provided together
  if (args.first && args.last) {
    paginationErrors.push({
      __typename: "IncorrectPairingOfArguments",
      message:
        "Both first and last argument can not be provided in the pagination arguments. Only one must be provided in a single query.",
      path: "first,last",
    });
  }

  // Positive integer GraphQL Scalar ensures that the first and last are greater than zero
  // Ensure that these arguments are less than the maximum allowed fetch limit
  if (
    (args.first && args.first > MAXIMUM_FETCH_LIMIT) ||
    (args.last && args.last > MAXIMUM_FETCH_LIMIT)
  ) {
    paginationErrors.push({
      __typename: "FetchLimitExceeded",
      message:
        "More items than the allowed number of items were requested to be fetched.",
      limit: MAXIMUM_FETCH_LIMIT,
      path: "first,last",
    });
  }

  // Check that only after can be provided with first
  if (args.first && args.before) {
    paginationErrors.push({
      __typename: "IncorrectPairingOfArguments",
      message:
        "The pagination arguments must not contain before argument if the first argument is provided.",
      path: "before",
    });
  }

  // Check that only before can be provided with last
  if (args.last && args.after) {
    paginationErrors.push({
      __typename: "IncorrectPairingOfArguments",
      message:
        "The pagination arguments must not contain after argument if the last argument is provided.",
      path: "after",
    });
  }

  return paginationErrors;
};
