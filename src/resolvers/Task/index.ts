import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { event } from "./event";
import { volunteers } from "./volunteers";

export const Task: TaskResolvers = {
  creator,
  event,
  volunteers,
};
