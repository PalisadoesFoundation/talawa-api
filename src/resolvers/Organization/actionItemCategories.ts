import { ActionItemCategory } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the categories of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all categories of the organization.
 */
export const actionItemCategories: OrganizationResolvers["actionItemCategories"] =
  async (parent) => {
    return await ActionItemCategory.find({
      organizationId: parent._id
    }).lean();
  };
