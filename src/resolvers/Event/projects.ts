import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { EventProject } from "../../models";

export const projects: EventResolvers["projects"] = async (parent) => {
  return await EventProject.find({
    event: parent._id,
  }).lean();
};
