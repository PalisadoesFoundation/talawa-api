import type { RecurrenceRuleResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";

/**
 * Resolver function for the `organization` field of a `RecurrenceRule`.
 *
 * This function retrieves the organization associated with a specific recurrence rule.
 *
 * @param parent - The parent object representing the recurrence rule. It contains information about the recurrence rule, including the ID of the organization associated with it.
 * @returns A promise that resolves to the organization document found in the database. This document represents the organization associated with the recurrence rule.
 *
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see RecurrenceRuleResolvers - The type definition for the resolvers of the RecurrenceRule fields.
 *
 */

export const organization: RecurrenceRuleResolvers["organization"] = async (
  parent,
) => {
  return await Organization.findOne({
    _id: parent.organizationId,
  }).lean();
};
