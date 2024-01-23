import type { UserResolvers } from "../../types/generatedGraphQLTypes";
// import { tagsAssignedWith } from "./tagsAssignedWith";
import { posts } from "./post";

export const User: UserResolvers = {
  // tagsAssignedWith,
  posts,
};
