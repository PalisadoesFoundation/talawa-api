import { InterfaceUser, User } from "../../models";
import type { ChatResolvers, ResolverTypeWrapper } from "../../types/generatedGraphQLTypes";

/**
 * This resolver function will fetch and return the list of all chat admins from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of users.
 */
export const admins: ChatResolvers["users"] = async (parent, args, context, info): Promise<ResolverTypeWrapper<InterfaceUser>[]> => {
  const users = await User.find({
    _id: {
      $in: parent.admins,
    },
  }).lean();

  // Ensure the result conforms to the expected type
  return users.map(user => ({
    ...user,
    // Add any necessary type adjustments here
  })) as ResolverTypeWrapper<InterfaceUser>[];
};