import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { tasks } from "./tasks";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";

export const EventProject: EventProjectResolvers = {
  tasks,
  createdBy,
  updatedBy,
};
