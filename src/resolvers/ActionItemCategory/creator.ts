import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `creator` field of an `ActionItemCategory`.
 *
 * This function retrieves the user who created a specific action item category.
 *
 * @param parent - The parent object representing the action item category. It contains information about the action item category, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the action item category.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see ActionItemCategoryResolvers - The type definition for the resolvers of the ActionItemCategory fields.
 */
export const creator: ActionItemCategoryResolvers["creator"] = async (
  parent,
) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
