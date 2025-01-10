import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaCategoryModel } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
/**
 * This query will fetch all categories for the organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization.
 * @returns A `categories` object that holds all categories for the Organization.
 */
export const agendaItemCategoriesByOrganization: QueryResolvers["agendaItemCategoriesByOrganization"] =
  async (_parent, args) => {
    const where = getWhere(args.where);
    return await AgendaCategoryModel.find({
      organizationId: args.organizationId,
      ...where,
    }).lean();
  };
