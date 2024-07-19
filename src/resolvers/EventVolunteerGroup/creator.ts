import { User } from "../../models";
import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `creator` field of an `EventVolunteerGroup`.
 *
 * This function retrieves the user who created a specific event volunteer group.
 *
 * @param parent - The parent object representing the event volunteer group. It contains information about the event volunteer group, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the event volunteer group.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see EventVolunteerGroupResolvers - The type definition for the resolvers of the EventVolunteerGroup fields.
 *
 */
export const creator: EventVolunteerGroupResolvers["creator"] = async (
  parent,
) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
