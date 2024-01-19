import type { UserResolvers } from "../../types/generatedGraphQLTypes";
// import { tagsAssignedWith } from "./tagsAssignedWith";
import { post } from "./post";

export const User: UserResolvers = {
  // tagsAssignedWith,
  post,
};
