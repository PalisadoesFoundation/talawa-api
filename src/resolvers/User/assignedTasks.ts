import { TaskVolunteer } from "../../models";
import type { UserResolvers } from "../../types/generatedGraphQLTypes";

export const assignedTasks: UserResolvers["assignedTasks"] = async (parent) => {
  const taskObjects = await TaskVolunteer.find({
    userId: parent._id,
  })
    .populate("taskId")
    .lean();

  return taskObjects.map((object) => object.taskId);
};
