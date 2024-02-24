import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: AgendaCategoryResolvers["createdBy"] = async (
  parent,
) => {
  return User.findOne(parent.createdBy).lean();
};
