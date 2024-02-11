import type { UserFamilyResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
/**
 * This resolver function will fetch and return the list of all Members of the user family from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the Member data.
 */
export const users: UserFamilyResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
