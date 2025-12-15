import { builder } from "~/src/graphql/builder";

// Minimal Post sorting enum to satisfy imports during schema generation.
export const PostOrderByInput = builder.enumType("PostOrderByInput", {
  values: ["createdAt_ASC", "createdAt_DESC"] as const,
  description: "Sorting criteria for Post, e.g., 'createdAt_ASC' or 'createdAt_DESC'",
});

export default PostOrderByInput;
