import { User } from "../../models";
import { DirectChatResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the specified Direct Chat User from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the User data.
 */
export const creator: DirectChatResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
