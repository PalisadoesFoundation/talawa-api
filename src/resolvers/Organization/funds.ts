import { Fund } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `funds` field of an `Organization`.
 *
 * This function retrieves the funds related to a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the organization.
 * @returns A promise that resolves to the fund documents found in the database. These documents represent the funds related to the organization.
 *
 * @see Fund - The Fund model used to interact with the funds collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const funds: OrganizationResolvers["funds"] = async (parent) => {
  return await Fund.find({
    organizationId: parent._id,
  }).lean();
};
