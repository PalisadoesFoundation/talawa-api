import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: AgendaItemResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organization).lean();
};
