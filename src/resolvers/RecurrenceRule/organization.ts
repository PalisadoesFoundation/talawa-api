import type { RecurrenceRuleResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: RecurrenceRuleResolvers["organization"] = async (
  parent,
) => {
  return await Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
