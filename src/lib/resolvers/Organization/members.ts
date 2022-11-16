import { User } from "../../models";
import { OrganizationResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the list of members of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all members of the organization.
 */
export const members: OrganizationResolvers["members"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.members,
    },
  }).lean();
};
