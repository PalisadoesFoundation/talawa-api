import { EventVolunteerGroup } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `group` field of an `EventVolunteer`.
 *
 * This function retrieves the group associated with a specific event volunteer.
 *
 * @param parent - The parent object representing the event volunteer. It contains information about the event volunteer, including the ID of the group associated with it.
 * @returns A promise that resolves to the group document found in the database. This document represents the group associated with the event volunteer.
 *
 * @see EventVolunteerGroup - The EventVolunteerGroup model used to interact with the event volunteer groups collection in the database.
 * @see EventVolunteerResolvers - The type definition for the resolvers of the EventVolunteer fields.
 *
 */
export const group: EventVolunteerResolvers["group"] = async (parent) => {
  return await EventVolunteerGroup.findOne({
    _id: parent.group,
  }).lean();
};
