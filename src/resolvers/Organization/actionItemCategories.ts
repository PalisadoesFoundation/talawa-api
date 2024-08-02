import { ActionItemCategory } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `actionItemCategories` field of an `Organization`.
 *
 * This function retrieves the action item categories related to a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the organization.
 * @returns A promise that resolves to the action item category documents found in the database. These documents represent the action item categories related to the organization.
 *
 * @see ActionItemCategory - The ActionItemCategory model used to interact with the action item categories collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const actionItemCategories: OrganizationResolvers["actionItemCategories"] =
  async (parent) => {
    return await ActionItemCategory.find({
      organizationId: parent._id,
    }).lean();
  };
