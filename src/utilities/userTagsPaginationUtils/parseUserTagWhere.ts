import type { UserTagWhereInput } from "../../types/generatedGraphQLTypes";
import type {
  DefaultGraphQLArgumentError,
  ParseGraphQLConnectionWhereResult,
} from "../graphQLConnection";

/*
 * function to parse the args.where for UserTag queries
 */

export type ParseUserTagWhereResult = {
  nameStartsWith: string;
};

export function parseUserTagWhere(
  where: UserTagWhereInput | null | undefined,
): ParseGraphQLConnectionWhereResult<ParseUserTagWhereResult> {
  const errors: DefaultGraphQLArgumentError[] = [];

  if (!where) {
    return {
      isSuccessful: true,
      parsedWhere: {
        nameStartsWith: "",
      },
    };
  } else {
    if (typeof where.name.starts_with !== "string") {
      errors.push({
        message: "Invalid name provided. It must be a string.",
        path: ["whereName"],
      });

      return {
        isSuccessful: false,
        errors,
      };
    } else {
      return {
        isSuccessful: true,
        parsedWhere: {
          nameStartsWith: where.name.starts_with.trim(),
        },
      };
    }
  }
}
