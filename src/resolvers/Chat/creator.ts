import { InterfaceUser, User } from "../../models";
import type { ChatResolvers, ResolverTypeWrapper } from "../../types/generatedGraphQLTypes";

/**
 * This resolver function will fetch and return the specified Chat User from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the User data.
 */
export const creator: ChatResolvers["creator"] = async (parent) => {
  const user = await User.findOne({
    _id: parent.creatorId,
  }).lean();

  if (!user) {
    return null;
  }

  // Ensure the result conforms to the expected type
  return {
    ...user,
    // Add any necessary type adjustments here
  } as ResolverTypeWrapper<InterfaceUser>;
};