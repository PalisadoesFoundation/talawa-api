import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { tasks } from "./tasks";
import { creator } from "./creator";

export const EventProject: EventProjectResolvers = {
  tasks,
  creator,
};
