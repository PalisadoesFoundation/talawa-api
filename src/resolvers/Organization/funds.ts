import { Fund } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This resolver function will fetch and return the funds of the Organization from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An array of objects that contains the funds data. If the funds not exists then returns an empty array.
 */
export const funds: OrganizationResolvers["funds"] = async (parent) => {
  return await Fund.find({
    organizationId: parent._id,
  }).lean();
};
