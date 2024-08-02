import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import { OrganizationTagUser } from "../../models";

/**
 * Resolver function for the `parentTag` field of a `UserTag`.
 *
 * This function retrieves the parent tag associated with a specific user tag.
 *
 * @param parent - The parent object representing the user tag. It contains information about the user tag, including the ID of the parent tag associated with it.
 * @returns A promise that resolves to the user tag document found in the database. This document represents the parent tag associated with the user tag.
 *
 * @see OrganizationTagUser - The OrganizationTagUser model used to interact with the user tags collection in the database.
 * @see UserTagResolvers - The type definition for the resolvers of the UserTag fields.
 *
 */
export const parentTag: UserTagResolvers["parentTag"] = async (parent) => {
  // Check if the parentTag is null
  if (parent.parentTagId === null) return null;

  // If the parentTag is not null, make a database request to fetch the same
  return await OrganizationTagUser.findOne({
    _id: parent.parentTagId,
  }).lean();
};
