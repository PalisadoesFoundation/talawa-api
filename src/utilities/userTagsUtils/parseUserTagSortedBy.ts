import type {
  SortedByOrder,
  UserTagSortedByInput,
} from "../../types/generatedGraphQLTypes";

/*
 * function to parse the args.sortedBy for UserTag queries
 */

export type ParseSortedByResult = {
  sortById: SortedByOrder;
};

export function parseUserTagSortedBy(
  sortedBy: UserTagSortedByInput | null | undefined,
): ParseSortedByResult {
  if (!sortedBy) {
    return {
      sortById: "DESCENDING",
    };
  } else {
    return {
      sortById: sortedBy.id,
    };
  }
}
