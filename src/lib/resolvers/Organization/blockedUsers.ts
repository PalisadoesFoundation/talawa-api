import { User } from "../../models";
import { OrganizationResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the blocked users for the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of blocked users for the organization.
 */
export const blockedUsers: OrganizationResolvers["blockedUsers"] = async (
  parent
) => {
  return await User.find({
    _id: {
      $in: parent.blockedUsers,
    },
  }).lean();
};
