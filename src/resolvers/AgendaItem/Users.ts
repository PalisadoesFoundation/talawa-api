import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `users` field of an `AgendaItem`.
 *
 * This function retrieves the users associated with a specific agenda item.
 *
 * @param parent - The parent object representing the agenda item. It contains information about the agenda item, including the IDs of the users associated with it.
 * @returns A promise that resolves to the user documents found in the database. These documents represent the users associated with the agenda item.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.
 *
 */
export const users: AgendaItemResolvers["users"] = async (parent) => {
  const userIds = parent.users; // Assuming parent.users is an array of user ids
  const users = await User.find({ _id: { $in: userIds } }); // Assuming User.find() returns a promise
  return users;
};
