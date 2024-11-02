import type { GraphQLConnectionTraversalDirection } from "../graphQLConnection";
import type { ParseSortedByResult } from "../userTagsPaginationUtils";

/**
 *This is typescript type of the object returned from `getUserTagGraphQLConnectionSort` function.
 */
type UserTagGraphQLConnectionSort =
  | {
      _id: 1;
    }
  | {
      _id: -1;
    };

/**
 * This function is used to get an object containing sorting logic.a
 */
export function getUserTagGraphQLConnectionSort({
  direction,
  sortById,
}: ParseSortedByResult & {
  direction: GraphQLConnectionTraversalDirection;
}): UserTagGraphQLConnectionSort {
  if (sortById === "ASCENDING") {
    if (direction === "BACKWARD") {
      return {
        _id: -1,
      };
    } else {
      return {
        _id: 1,
      };
    }
  } else {
    if (direction === "BACKWARD") {
      return {
        _id: 1,
      };
    } else {
      return {
        _id: -1,
      };
    }
  }
}
