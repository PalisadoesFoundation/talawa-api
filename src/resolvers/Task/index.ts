import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { volunteers } from "./volunteers";

export const Task: TaskResolvers = {
  volunteers,
};
