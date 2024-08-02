import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `creator` field of a `GroupChat`.
 *
 * This function retrieves the user who created a specific group chat.
 *
 * @param parent - The parent object representing the group chat. It contains information about the group chat, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the group chat.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see GroupChatResolvers - The type definition for the resolvers of the GroupChat fields.
 *
 */
export const creator: GroupChatResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
