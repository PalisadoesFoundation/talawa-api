import { User } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `creator` field of an `EventVolunteer`.
 *
 * This function retrieves the user who created a specific event volunteer.
 *
 * @param parent - The parent object representing the event volunteer. It contains information about the event volunteer, including the ID of the user who created it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who created the event volunteer.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see EventVolunteerResolvers - The type definition for the resolvers of the EventVolunteer fields.
 *
 */
export const creator: EventVolunteerResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
