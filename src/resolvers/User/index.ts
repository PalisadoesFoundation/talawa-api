import type { UserResolvers } from "../../types/generatedGraphQLTypes";
import { tagsAssignedWith } from "./tagsAssignedWith";
import { posts } from "./posts";

export const User: UserResolvers = {
  tagsAssignedWith,
  posts,
};
