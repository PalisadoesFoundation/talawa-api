import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

/**
 * Resolver function for the `creator` field of an `Event`.
 *
 * This function retrieves the user who created a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the event.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const creator: EventResolvers["creator"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
