import type { UserTagUsersAssignedToWhereInput } from "../../types/generatedGraphQLTypes";
import type {
  DefaultGraphQLArgumentError,
  ParseGraphQLConnectionWhereResult,
} from "../graphQLConnection";

/**
 * Type of the where object returned if the parsing is successful
 */
export type ParseUserTagMemberWhereResult = {
  firstNameStartsWith: string;
  lastNameStartsWith: string;
};

/**
 * Function to parse the args.where for UserTag member assignment queries
 */
export function parseUserTagMemberWhere(
  where: UserTagUsersAssignedToWhereInput | null | undefined,
): ParseGraphQLConnectionWhereResult<ParseUserTagMemberWhereResult> {
  const errors: DefaultGraphQLArgumentError[] = [];

  if (!where) {
    return {
      isSuccessful: true,
      parsedWhere: {
        firstNameStartsWith: "",
        lastNameStartsWith: "",
      },
    };
  }

  if (!where.firstName && !where.lastName) {
    errors.push({
      message: `At least one of firstName or lastName should be provided`,
      path: ["where"],
    });

    return {
      isSuccessful: false,
      errors,
    };
  }

  if (where.firstName && typeof where.firstName.starts_with !== "string") {
    errors.push({
      message: "Invalid firstName provided. It must be a string.",
      path: ["where", "firstName", "starts_with"],
    });
  }

  if (where.lastName && typeof where.lastName.starts_with !== "string") {
    errors.push({
      message: "Invalid lastName provided. It must be a string.",
      path: ["where", "lastName", "starts_with"],
    });
  }

  if (errors.length > 0) {
    return {
      isSuccessful: false,
      errors,
    };
  }

  return {
    isSuccessful: true,
    parsedWhere: {
      firstNameStartsWith: where.firstName?.starts_with.trim() ?? "",
      lastNameStartsWith: where.lastName?.starts_with.trim() ?? "",
    },
  };
}
