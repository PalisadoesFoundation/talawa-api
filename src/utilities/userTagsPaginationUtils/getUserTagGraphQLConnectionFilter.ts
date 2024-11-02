import type { GraphQLConnectionTraversalDirection } from "../graphQLConnection";
import type {
  ParseSortedByResult,
  ParseUserTagWhereResult,
} from "../userTagsPaginationUtils";

/**
 * This is typescript type of the object returned from function `getUserTagGraphQLConnectionFilter`.
 */
type BaseUserTagGraphQLConnectionFilter = {
  name: {
    $regex: RegExp;
  };
};

type UserTagGraphQLConnectionFilter = BaseUserTagGraphQLConnectionFilter &
  (
    | {
        _id?: {
          $lt: string;
        };
      }
    | {
        _id?: {
          $gt: string;
        };
      }
  );
/**
 * This function is used to get an object containing filtering logic.
 */
export function getUserTagGraphQLConnectionFilter({
  cursor,
  direction,
  sortById,
  nameStartsWith,
}: ParseSortedByResult &
  ParseUserTagWhereResult & {
    cursor: string | null;
    direction: GraphQLConnectionTraversalDirection;
  }): UserTagGraphQLConnectionFilter {
  const filter = {} as UserTagGraphQLConnectionFilter;

  filter.name = {
    $regex: new RegExp(
      `^${nameStartsWith.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    ),
  };

  if (cursor !== null) {
    filter._id = getCursorFilter(cursor, sortById, direction);
  }

  return filter;
}

function getCursorFilter(
  cursor: string,
  sortById: "ASCENDING" | "DESCENDING",
  direction: GraphQLConnectionTraversalDirection,
): { $lt: string } | { $gt: string } {
  if (sortById === "ASCENDING") {
    return direction === "BACKWARD" ? { $lt: cursor } : { $gt: cursor };
  }
  return direction === "BACKWARD" ? { $gt: cursor } : { $lt: cursor };
}
