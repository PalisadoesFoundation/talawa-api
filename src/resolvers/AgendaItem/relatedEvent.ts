import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

/**
 * Resolver function for the `relatedEvent` field of an `AgendaItem`.
 *
 * This function retrieves the event related to a specific agenda item.
 *
 * @param parent - The parent object representing the agenda item. It contains information about the agenda item, including the ID of the related event.
 * @returns A promise that resolves to the event document found in the database. This document represents the event related to the agenda item.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see AgendaItemResolvers - The type definition for the resolvers of the AgendaItem fields.
 *
 */
export const relatedEvent: AgendaItemResolvers["relatedEvent"] = async (
  parent,
) => {
  return Event.findOne(parent.relatedEvent).lean();
};
