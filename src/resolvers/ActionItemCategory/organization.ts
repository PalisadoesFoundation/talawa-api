import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * Resolver function for the `organization` field of an `ActionItemCategory`.
 *
 * This function fetches the organization associated with a given action item category.
 * It uses the `organizationId` field from the parent `ActionItemCategory` object to find the corresponding organization in the database.
 * The organization details are then returned in a plain JavaScript object format.
 *
 * @param parent - The parent `ActionItemCategory` object. This contains the `organizationId` field, which is used to find the organization.
 * @returns A promise that resolves to the organization object found in the database, or `null` if no organization is found.
 *
 * @example
 * ```typescript
 * const actionItemCategory = {
 *   organizationId: "60d0fe4f5311236168a109cc"
 * };
 * const organization = await organization(actionItemCategory);
 * console.log(organization);
 * // Output might be: { _id: "60d0fe4f5311236168a109cc", name: "Tech Corp", address: "123 Tech Lane" }
 * ```
 */
export const organization: ActionItemCategoryResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
