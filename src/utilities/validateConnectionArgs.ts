import type { UserPostsArgs } from "../types/generatedGraphQLTypes";

export const validateConnectionArgs = (args: UserPostsArgs): void => {
  const { first, last, after, before } = args;

  if (!((first && !last) || (!first && last) || (!first && !last))) {
    throw new Error("Provide either 'first' or 'last', not both");
  }

  if (!((after && !before) || (!after && before) || (!after && !before))) {
    throw new Error("Provide either 'after' or 'before', not both");
  }

  if ((first && !after) || (last && !before)) {
    throw new Error(
      "When using 'first', provide 'after'; when using 'last', provide 'before'"
    );
  }
};
