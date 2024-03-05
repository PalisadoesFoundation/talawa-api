import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: AgendaItemResolvers["updatedBy"] = async (parent) => {
  return User.findOne(parent.updatedBy).lean();
};
