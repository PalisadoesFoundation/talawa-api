import { User } from "../../models";
import type { DirectChatResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the specified Direct Chat User from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the User data.
 */
export const creatorId: DirectChatResolvers["creatorId"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
