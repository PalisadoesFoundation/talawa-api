import { GroupChatResolvers } from "../../../generated/graphqlCodegen";
import { Organization } from "../../models";

/**
 * This resolver function will fetch and return the organization for group chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the organization data.
 */
export const organization: GroupChatResolvers["organization"] = async (
  parent
) => {
  return await Organization.findOne({
    _id: parent.organization,
  }).lean();
};
