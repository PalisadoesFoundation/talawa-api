import { Types } from "mongoose";
import type { GraphQLConnectionTraversalDirection } from "../graphQLConnection";
import type {
  ParseSortedByResult,
  ParseUserTagMemberWhereResult,
} from "../userTagsPaginationUtils";

/**
 * This is typescript type of the object returned from function `getUserTagMemberGraphQLConnectionFilter`.
 */
type BaseUserTagMemberGraphQLConnectionFilter = {
  firstName: {
    $regex: RegExp;
  };
  lastName: {
    $regex: RegExp;
  };
};

type UserTagMemberGraphQLConnectionFilter =
  BaseUserTagMemberGraphQLConnectionFilter &
    (
      | {
          _id?: {
            $lt: Types.ObjectId;
          };
        }
      | {
          _id?: {
            $gt: Types.ObjectId;
          };
        }
    );

/**
 * This function is used to get an object containing filtering logic.
 */
export function getUserTagMemberGraphQLConnectionFilter({
  cursor,
  direction,
  sortById,
  firstNameStartsWith,
  lastNameStartsWith,
}: ParseSortedByResult &
  ParseUserTagMemberWhereResult & {
    cursor: string | null;
    direction: GraphQLConnectionTraversalDirection;
  }): UserTagMemberGraphQLConnectionFilter {
  const filter = {} as UserTagMemberGraphQLConnectionFilter;

  filter.firstName = {
    $regex: new RegExp(
      `^${firstNameStartsWith.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    ),
  };
  filter.lastName = {
    $regex: new RegExp(
      `^${lastNameStartsWith.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
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
): { $lt: Types.ObjectId } | { $gt: Types.ObjectId } {
  const cursorId = new Types.ObjectId(cursor);
  if (sortById === "ASCENDING") {
    return direction === "BACKWARD" ? { $lt: cursorId } : { $gt: cursorId };
  }
  return direction === "BACKWARD" ? { $gt: cursorId } : { $lt: cursorId };
}
