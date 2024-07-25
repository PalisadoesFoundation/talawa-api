import type { OrganizationResolvers } from "./../../types/generatedGraphQLTypes";
import { Venue } from "../../models";

/**
 * Resolver function for the `venues` field of an `Organization`.
 *
 * This function retrieves the venues related to a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the organization.
 * @returns A promise that resolves to the venue documents found in the database. These documents represent the venues related to the organization.
 *
 * @see Venue - The Venue model used to interact with the venues collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const venues: OrganizationResolvers["venues"] = async (parent) => {
  return await Venue.find({ organization: parent._id.toString() }).lean();
};
