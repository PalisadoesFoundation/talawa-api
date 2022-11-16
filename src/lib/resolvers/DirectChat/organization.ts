import { Organization } from "../../models";
import { DirectChatResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the Organization for the Direct Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains Organization data.
 */
export const organization: DirectChatResolvers["organization"] = async (
  parent
) => {
  return await Organization.findOne({
    _id: parent.organization,
  }).lean();
};
