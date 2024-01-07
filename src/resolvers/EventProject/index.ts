import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { tasks } from "./tasks";
import { creatorId } from "./creatorId";

export const EventProject: EventProjectResolvers = {
  tasks,
  creatorId,
};
