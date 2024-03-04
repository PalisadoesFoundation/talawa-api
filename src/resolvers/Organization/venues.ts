import type { OrganizationResolvers } from "./../../types/generatedGraphQLTypes";
import { Venue } from "../../models";
/**
 * This resolver will fetch the list of all venues within an Organization from database.
 * @param parent- An object that contains `id` of the organization.
 * @returns An array that contains the venues.
 */
export const venues: OrganizationResolvers["venues"] = async (parent) => {
  return await Venue.find({ organization: parent._id.toString() }).lean();
};
