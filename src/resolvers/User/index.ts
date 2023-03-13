import { UserResolvers } from "../../types/generatedGraphQLTypes";
import { tagsAssignedWith } from "./tagsAssignedWith";

export const User: UserResolvers = {
  tagsAssignedWith,
};
