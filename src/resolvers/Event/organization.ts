import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * Resolver function for the `organization` field of an `Event`.
 *
 * This function retrieves the organization associated with a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the organization it is associated with.
 * @returns A promise that resolves to the organization document found in the database. This document represents the organization associated with the event.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const organization: EventResolvers["organization"] = async (parent) => {
  return Organization.findOne({
    _id: parent.organization,
  }).lean();
};
