import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { tasks } from "./tasks";
import { createdBy } from "./createdBy";

export const EventProject: EventProjectResolvers = {
  tasks,
  createdBy,
};
