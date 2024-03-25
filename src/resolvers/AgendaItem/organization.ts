import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
//@ts-expect-error - type error

export const organization: AgendaItemResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organization).lean();
};
