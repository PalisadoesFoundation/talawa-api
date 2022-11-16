import { User } from "../../models";
import { OrganizationResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the admins of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all admins of the organization.
 */
export const admins: OrganizationResolvers["admins"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.admins,
    },
  }).lean();
};
