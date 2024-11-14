// Context object contains an apiRootUrl for mapping DNS request of server to its domain, for example: http:abcd.com/
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `image` field of an `Organization`.
 *
 * This function retrieves the image URL of a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the image URL.
 * @returns The URL of the image of the organization.
 *
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const image: OrganizationResolvers["image"] = (parent) => {
  if (parent.image) {
    return parent.image;
  }
  return null;
};
