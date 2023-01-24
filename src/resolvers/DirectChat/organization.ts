import { Organization } from "../../models";
import { DirectChatResolvers } from "../../types/generatedGraphQLTypes";

export const organization: DirectChatResolvers["organization"] = async (
  parent
) => {
  return await Organization.findOne({
    _id: parent.organization,
  }).lean();
};
