import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `updatedBy` field of an `AgendaItem`.
 *
 * This function retrieves the user who last updated a specific agenda item.
 *
 * @param parent - The parent object representing the agenda item. It contains information about the agenda item, including the ID of the user who last updated it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who last updated the agenda item.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.
 *
 */
//@ts-expect-error - type error

export const updatedBy: AgendaItemResolvers["updatedBy"] = async (parent) => {
  return User.findOne(parent.updatedBy).lean();
};
