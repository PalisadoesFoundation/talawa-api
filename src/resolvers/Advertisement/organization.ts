import type { AdvertisementResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import type { InterfaceOrganization } from '../../models';
import type { Types } from "mongoose";

/**
 * Resolver function for the `organization` field of an `Advertisement`.
 *
 * This function fetches the organization associated with a given advertisement.
 * It uses the `organizationId` field from the parent `Advertisement` object to find the corresponding organization in the database.
 * The organization details are then returned in a plain JavaScript object format.
 *
 * @param parent - The parent `Advertisement` object. This contains the `organizationId` field, which is used to find the organization.
 * @returns A promise that resolves to the organization object found in the database, or `null` if no organization is found.
 *
 */
export const organization: AdvertisementResolvers["organization"] = async (
  parent,
): Promise<InterfaceOrganization | null> => {
  if (!parent.organizationId) return null;

  return Organization.findOne({
    _id: parent.organizationId as Types.ObjectId,
  }).lean() as Promise<InterfaceOrganization | null>;
};