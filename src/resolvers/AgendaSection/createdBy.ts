import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: AgendaSectionResolvers["createdBy"] = async (
  parent,
) => {
  return User.findOne(parent.createdBy).lean();
};
