import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { Task } from "../../models";

export const tasks: EventProjectResolvers["tasks"] = async (parent) => {
  return await Task.find({
    eventProjectId: parent._id,
  }).lean();
};
