import type { TaskResolvers } from "../../types/generatedGraphQLTypes";
import { TaskVolunteer } from "../../models";

export const volunteers: TaskResolvers["volunteers"] = async (parent) => {
  const volunteerObjects = await TaskVolunteer.find({
    taskId: parent._id,
  })
    .populate("userId")
    .lean();
  return volunteerObjects.map((object) => object.userId);
};
