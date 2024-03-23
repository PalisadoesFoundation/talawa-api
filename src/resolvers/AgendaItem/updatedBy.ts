import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
//@ts-expect-error - type error

export const updatedBy: AgendaItemResolvers["updatedBy"] = async (parent) => {
  return User.findOne(parent.updatedBy).lean();
};
