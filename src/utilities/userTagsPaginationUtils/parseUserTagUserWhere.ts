import type { UserTagUsersAssignedToWhereInput } from "../../types/generatedGraphQLTypes";
import type {
  DefaultGraphQLArgumentError,
  ParseGraphQLConnectionWhereResult,
} from "../graphQLConnection";

/*
 * function to parse the args.where for UserTag member assignment queries
 */

export type ParseUserTagUserWhereResult = {
  firstNameStartsWith: string;
  lastNameStartsWith: string;
};

export function parseUserTagUserWhere(
  where: UserTagUsersAssignedToWhereInput | null | undefined,
): ParseGraphQLConnectionWhereResult<ParseUserTagUserWhereResult> {
  const errors: DefaultGraphQLArgumentError[] = [];

  if (!where) {
    return {
      isSuccessful: true,
      parsedWhere: {
        firstNameStartsWith: "",
        lastNameStartsWith: "",
      },
    };
  } else {
    if (!where.firstName && !where.lastName) {
      errors.push({
        message: `Atleast one of firstName or lastName should be provided`,
        path: ["whereUserNameInput"],
      });

      return {
        isSuccessful: false,
        errors,
      };
    } else if (
      where.firstName &&
      typeof where.firstName.starts_with !== "string"
    ) {
      errors.push({
        message: "Invalid firstName provided. It must be a string.",
        path: ["whereUserTagUserNameInput"],
      });

      return {
        isSuccessful: false,
        errors,
      };
    } else if (
      where.lastName &&
      typeof where.lastName.starts_with !== "string"
    ) {
      errors.push({
        message: "Invalid lastName provided. It must be a string.",
        path: ["whereUserTagUserNameInput"],
      });

      return {
        isSuccessful: false,
        errors,
      };
    } else {
      return {
        isSuccessful: true,
        parsedWhere: {
          firstNameStartsWith: where.firstName?.starts_with.trim() ?? "",
          lastNameStartsWith: where.lastName?.starts_with.trim() ?? "",
        },
      };
    }
  }
}
