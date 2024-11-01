import type {
  SortedByOrder,
  UserTagSortedByInput,
} from "../../types/generatedGraphQLTypes";
import type {
  DefaultGraphQLArgumentError,
  ParseGraphQLConnectionSortedByResult,
} from "../graphQLConnection";

/*
 * function to parse the args.sortedBy for UserTag queries
 */

export type ParseSortedByResult = {
  sortById: SortedByOrder;
};

export function parseUserTagSortedBy(
  sortedBy: UserTagSortedByInput | null | undefined,
): ParseGraphQLConnectionSortedByResult<ParseSortedByResult> {
  const errors: DefaultGraphQLArgumentError[] = [];

  if (!sortedBy) {
    return {
      isSuccessful: true,
      parsedSortedBy: { sortById: "DESCENDING" },
    };
  } else {
    if (sortedBy.id !== "DESCENDING" && sortedBy.id !== "ASCENDING") {
      errors.push({
        message:
          "Invalid sortedById provided. It must be a of type SortedByOrder.",
        path: ["sortedById"],
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
}
