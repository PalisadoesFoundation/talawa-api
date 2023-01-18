import { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

export const organization: MembershipRequestResolvers["organization"] = async (
  parent
) => {
  return Organization.findOne({
    _id: parent.organization,
  }).lean();
};
