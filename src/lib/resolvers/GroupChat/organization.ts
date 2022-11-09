import { GroupChatResolvers } from "../../../generated/graphqlCodegen";
import { Organization } from "../../models";

export const organization: GroupChatResolvers["organization"] = async (
  parent
) => {
  return await Organization.findOne({
    _id: parent.organization,
  }).lean();
};
