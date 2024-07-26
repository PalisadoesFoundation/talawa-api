import { AgendaCategoryModel } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `agendaCategories` field of an `Organization`.
 *
 * This function retrieves the agenda categories of a specific organization.
 *
 * @param parent - The parent object representing the organization. It contains information about the organization, including the ID of the organization.
 * @returns A promise that resolves to an array of agenda category documents found in the database. These documents represent the agenda categories of the organization.
 *
 * @see AgendaCategoryModel - The AgendaCategory model used to interact with the agendaCategories collection in the database.
 * @see OrganizationResolvers - The type definition for the resolvers of the Organization fields.
 *
 */
export const agendaCategories: OrganizationResolvers["agendaCategories"] =
  async (parent) => {
    return await AgendaCategoryModel.find({
      organizationId: parent._id,
    }).lean();
  };
