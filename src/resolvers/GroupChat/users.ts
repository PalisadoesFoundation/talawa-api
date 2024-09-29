import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `users` field of a `GroupChat`.
 *
 * This function retrieves the users who are members of a specific group chat.
 *
 * @param parent - The parent object representing the group chat. It contains information about the group chat, including the IDs of the users who are members of it.
 * @returns A promise that resolves to the user documents found in the database. These documents represent the users who are members of the group chat.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see GroupChatResolvers - The type definition for the resolvers of the GroupChat fields.
 *
 */
export const users: GroupChatResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
