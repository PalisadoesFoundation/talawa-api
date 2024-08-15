import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * Resolver function for the `organization` field of an `AgendaItem`.
 *
 * This function retrieves the organization associated with a specific agenda item.
 *
 * @param parent - The parent object representing the agenda item. It contains information about the agenda item, including the ID of the organization it is associated with.
 * @returns A promise that resolves to the organization document found in the database. This document represents the organization associated with the agenda item.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.
 *
 */
//@ts-expect-error - type error

export const organization: AgendaItemResolvers["organization"] = async (
  parent,
) => {
  return Organization.findOne(parent.organization).lean();
};
