import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `assignee` field of an `ActionItem`.
 *
 * This function fetches the user who is assigned to a specific action item.
 *
 * @param parent - The parent object representing the action item. It contains information about the action item, including the ID of the user assigned to it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user assigned to the action item.
 *
 * @example
 * If the action item with an ID of `123` is assigned to a user with an ID of `456`, this resolver will find the user with the ID `456` in the database and return their information.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see ActionItemResolvers - The type definition for the resolvers of the ActionItem fields.
 */
export const assignee: ActionItemResolvers["assignee"] = async (parent) => {
  return User.findOne({
    _id: parent.assigneeId,
  }).lean();
};
