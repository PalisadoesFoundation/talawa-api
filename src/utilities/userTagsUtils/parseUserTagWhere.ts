import type { UserTagWhereInput } from "../../types/generatedGraphQLTypes";

/*
 * function to parse the args.where for UserTag queries
 */

export type ParseUserTagWhereResult = {
  nameStartsWith: string;
};

export function parseUserTagWhere(
  where: UserTagWhereInput | null | undefined,
): ParseUserTagWhereResult {
  if (!where) {
    return {
      nameStartsWith: "",
    };
  } else {
    return {
      nameStartsWith: where.name.starts_with.trim(),
    };
  }
}
