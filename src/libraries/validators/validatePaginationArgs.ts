import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import type {
  ConnectionError,
  CursorPaginationInput,
} from "../../types/generatedGraphQLTypes";

export const validatePaginationArgs = (
  args: CursorPaginationInput
): ConnectionError[] => {
  const connectionErrors: ConnectionError[] = [];

  // Positive integer GraphQL Scalar ensures that the first and last are greater than zero
  // Ensure that these arguments are less than the maximum allowed fetch limit
  if (args.limit > MAXIMUM_FETCH_LIMIT) {
    connectionErrors.push({
      __typename: "MaximumValueError",
      message:
        "More items than the allowed number of items were requested to be fetched.",
      limit: MAXIMUM_FETCH_LIMIT,
      path: ["limit"],
    });
  }

  return connectionErrors;
};
