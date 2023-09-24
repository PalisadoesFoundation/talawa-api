import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { EventProject } from "../../models";

export const event: TaskResolvers["event"] = async (parent) => {
  const eventProjectObject = await EventProject.findOne({
    _id: parent.eventProjectId,
  })
    .populate("event")
    .lean();

  return eventProjectObject!.event;
};
