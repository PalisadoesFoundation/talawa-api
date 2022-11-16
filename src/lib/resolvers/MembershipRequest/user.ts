import { MembershipRequestResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

/**
 * This resolver function will retrieve and return the user who sent the membership request from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */
export const user: MembershipRequestResolvers["user"] = async (parent) => {
  return await User.findOne({
    _id: parent.user,
  }).lean();
};
