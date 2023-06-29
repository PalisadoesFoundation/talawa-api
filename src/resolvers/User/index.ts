import type { UserResolvers } from "../../types/generatedGraphQLTypes";
import { assignedTasks } from "./assignedTasks";
// import { tagsAssignedWith } from "./tagsAssignedWith";

export const User: UserResolvers = {
  assignedTasks,
  // tagsAssignedWith,
};
