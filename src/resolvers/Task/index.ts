import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { createdBy } from "./createdBy";
import { event } from "./event";
import { volunteers } from "./volunteers";

export const Task: TaskResolvers = {
  createdBy,
  event,
  volunteers,
};
