import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * Resolver function for the `organization` field of an `AgendaCategory`.
 *
 * This function fetches the organization associated with a given agenda category.
 * It uses the `organizationId` field from the parent `AgendaCategory` object to find the corresponding organization in the database.
 * The organization details are then returned in a plain JavaScript object format.
 *
 * @param parent - The parent `AgendaCategory` object. This contains the `organizationId` field, which is used to find the organization.
 * @returns A promise that resolves to the organization object found in the database, or `null` if no organization is found.
 */

//@ts-expect-error - type error
export const organization: AgendaCategoryResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organizationId).lean();
};
