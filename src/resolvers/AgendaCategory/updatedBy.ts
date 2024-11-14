import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `updatedBy` field of an `AgendaCategory`.
 *
 * This function retrieves the user who last updated a specific agenda category.
 *
 * @param parent - The parent object representing the agenda category. It contains information about the agenda category, including the ID of the user who last updated it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who last updated the agenda category.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see AgendaCategoryResolvers - The type definition for the resolvers of the AgendaCategory fields.
 *
 * ```typescript
 * return User.findOne({ _id: parent.updatedBy }).lean();
 * ```
 */
export const updatedBy: AgendaCategoryResolvers["updatedBy"] = async (
  parent,
) => {
  return User.findOne(parent.updatedBy).lean();
};
