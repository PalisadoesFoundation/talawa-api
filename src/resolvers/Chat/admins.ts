import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import type {
  ChatResolvers,
  ResolverTypeWrapper,
} from "../../types/generatedGraphQLTypes";
import type { Types } from "mongoose";
/**
 * This resolver function will fetch and return the list of all chat admins from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of users.
 */
export const admins: ChatResolvers["users"] = async (
  parent,
  _args,
  _context,
  _info,
): Promise<ResolverTypeWrapper<InterfaceUser>[]> => {
  if (!parent.admins?.length) return [];

  const users = await User.find({
    _id: {
      $in: parent.admins as Types.ObjectId[],
    },
  }).lean();

  return users as ResolverTypeWrapper<InterfaceUser>[];
};