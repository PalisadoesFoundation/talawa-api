import { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: UserTagResolvers["organization"] = async (
  parent
) => {
  return await Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
