import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { creatorId } from "./creatorId";
import { event } from "./event";
import { volunteers } from "./volunteers";

export const Task: TaskResolvers = {
  creatorId,
  event,
  volunteers,
};
