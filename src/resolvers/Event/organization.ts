import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: EventResolvers["organization"] = async (parent) => {
  return Organization.findOne({
    _id: parent.organization,
  }).lean();
};
