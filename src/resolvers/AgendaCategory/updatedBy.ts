import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: AgendaCategoryResolvers["updatedBy"] = async (
  parent
) => {
  return User.findOne(parent.updatedBy).lean();
};
