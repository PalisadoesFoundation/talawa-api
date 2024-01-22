import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
/**
 * This resolver function will fetch and return the Fund creator(User) from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */
export const creator: FundResolvers["creator"] = async (parent) => {
  return await User.findOne({
    id: parent?.creator,
  }).lean();
};
