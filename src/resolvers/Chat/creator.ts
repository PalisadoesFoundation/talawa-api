import { User } from "../../models";
import type { ChatResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the specified Chat User from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the User data.
 */
export const creator: ChatResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
