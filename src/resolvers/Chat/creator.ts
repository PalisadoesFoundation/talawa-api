import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import type {
  ChatResolvers,
  ResolverTypeWrapper,
} from "../../types/generatedGraphQLTypes";
import type { Types } from "mongoose";

/**
 * This resolver function will fetch and return the specified Chat User from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the User data.
 */
export const creator: ChatResolvers["creator"] = async (
  parent,
): Promise<ResolverTypeWrapper<InterfaceUser> | null> => {
  if (!parent.creatorId) return null;

  const user = await User.findOne({
    _id: parent.creatorId as Types.ObjectId,
  }).lean();

  return user ? (user as ResolverTypeWrapper<InterfaceUser>) : null;
};
