import type { RecurrenceRuleResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

/**
 * Resolver function for the `baseRecurringEvent` field of a `RecurrenceRule`.
 *
 * This function retrieves the base recurring event associated with a specific recurrence rule.
 *
 * @param parent - The parent object representing the recurrence rule. It contains information about the recurrence rule, including the ID of the base recurring event associated with it.
 * @returns A promise that resolves to the event document found in the database. This document represents the base recurring event associated with the recurrence rule.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see RecurrenceRuleResolvers - The type definition for the resolvers of the RecurrenceRule fields.
 *
 */
export const baseRecurringEvent: RecurrenceRuleResolvers["baseRecurringEvent"] =
  async (parent) => {
    return await Event.findOne({
      _id: parent.baseRecurringEventId,
    }).lean();
  };
