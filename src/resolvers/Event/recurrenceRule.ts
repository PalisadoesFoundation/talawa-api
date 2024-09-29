import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../models/RecurrenceRule";

/**
 * Resolver function for the `recurrenceRule` field of an `Event`.
 *
 * This function retrieves the recurrence rule associated with a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the recurrence rule associated with it.
 * @returns A promise that resolves to the recurrence rule document found in the database. This document represents the recurrence rule associated with the event.
 *
 * @see RecurrenceRule - The RecurrenceRule model used to interact with the recurrence rules collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */

export const recurrenceRule: EventResolvers["recurrenceRule"] = async (
  parent,
) => {
  return await RecurrenceRule.findOne({
    _id: parent.recurrenceRuleId,
  }).lean();
};
