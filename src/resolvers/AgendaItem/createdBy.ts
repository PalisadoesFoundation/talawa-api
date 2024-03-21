import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: AgendaItemResolvers["createdBy"] = async (parent) => {
  return User.findOne(parent.createdBy).lean();
};
