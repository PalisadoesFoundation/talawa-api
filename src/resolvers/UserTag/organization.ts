import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * Resolver function for the `organization` field of a `UserTag`.
 *
 * This function retrieves the organization associated with a specific user tag.
 *
 * @param parent - The parent object representing the user tag. It contains information about the user tag, including the ID of the organization associated with it.
 * @returns A promise that resolves to the organization document found in the database. This document represents the organization associated with the user tag.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see UserTagResolvers - The type definition for the resolvers of the UserTag fields.
 *
 */
export const organization: UserTagResolvers["organization"] = async (
  parent,
) => {
  return await Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
