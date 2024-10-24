import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";
import type { InterfaceEvent } from "../../models/Event";
/**
 * This query will fetch all the events with the same BaseRecurringEventId from the database.
 * @param _parent -
 * @param args - An object that contains `baseRecurringEventId` of the base recurring event.
 * @returns An array of `Event` objects that are instances of the base recurring event.
 */

export const getRecurringEvents: QueryResolvers["getRecurringEvents"] = async (
  _parent,
  args,
) => {
  try {
    const recurringEvents = await Event.find({
      baseRecurringEventId: args.baseRecurringEventId,
    }).lean();

    return recurringEvents as InterfaceEvent[];
  } catch (error) {
    console.error("Error fetching recurring events:", error);
    throw error;
  }
};
