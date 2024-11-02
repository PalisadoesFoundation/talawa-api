import type { GraphQLConnectionTraversalDirection } from ".";
import type {
  ParseSortedByResult,
  ParseUserTagWhereResult,
} from "../userTagsPaginationUtils";

/**
 * This is typescript type of the object returned from function `getUserTagGraphQLConnectionFilter`.
 */
type UserTagGraphQLConnectionFilter =
  | {
      _id?: {
        $lt: string;
      };
      name: {
        $regex: RegExp;
      };
    }
  | {
      _id?: {
        $gt: string;
      };
      name: {
        $regex: RegExp;
      };
    };

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
    if (sortById === "ASCENDING") {
      if (direction === "BACKWARD") {
        filter._id = {
          $lt: cursor,
        };
      } else {
        filter._id = {
          $gt: cursor,
        };
      }
    } else {
      if (direction === "BACKWARD") {
        filter._id = {
          $gt: cursor,
        };
      } else {
        filter._id = {
          $lt: cursor,
        };
      }
    }
  }

  return filter;
}
