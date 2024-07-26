import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `createdBy` field of an `AgendaSection`.
 *
 * This function retrieves the user who created a specific agenda section.
 *
 * @param parent - The parent object representing the agenda section. It contains information about the agenda section, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the agenda section.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see AgendaSectionResolvers - The type definition for the resolvers of the AgendaSection fields.
 *
 */
export const createdBy: AgendaSectionResolvers["createdBy"] = async (
  parent,
) => {
  return User.findOne(parent.createdBy).lean();
};
