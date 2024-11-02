import type {
  SortedByOrder,
  UserTagSortedByInput,
} from "../../types/generatedGraphQLTypes";
import type {
  DefaultGraphQLArgumentError,
  ParseGraphQLConnectionSortedByResult,
} from "../graphQLConnection";

/**
 * type of the sort object returned if the parsing is successful
 */
export type ParseSortedByResult = {
  sortById: SortedByOrder;
};

/**
 * function to parse the args.sortedBy for UserTag queries
 */
export function parseUserTagSortedBy(
  sortedBy: UserTagSortedByInput | null | undefined,
): ParseGraphQLConnectionSortedByResult<ParseSortedByResult> {
  const errors: DefaultGraphQLArgumentError[] = [];

  if (!sortedBy) {
    return {
      isSuccessful: true,
      parsedSortedBy: { sortById: "DESCENDING" },
    };
  }

  if (sortedBy.id !== "DESCENDING" && sortedBy.id !== "ASCENDING") {
    errors.push({
      message:
        "Invalid sortedById provided. It must be a of type SortedByOrder.",
      path: ["sortedBy", "id"],
    });
    return {
      isSuccessful: false,
      errors,
    };
  }

  return {
    isSuccessful: true,
    parsedSortedBy: {
      sortById: sortedBy.id,
    },
  };
}
