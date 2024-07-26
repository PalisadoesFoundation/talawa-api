import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

/**
 * Resolver function for the `relatedEvent` field of an `AgendaSection`.
 *
 * This function retrieves the event related to a specific agenda section.
 *
 * @param parent - The parent object representing the agenda section. It contains information about the agenda section, including the ID of the related event.
 * @returns A promise that resolves to the event document found in the database. This document represents the event related to the agenda section.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see AgendaSectionResolvers - The type definition for the resolvers of the AgendaSection fields.
 *
 */

export const relatedEvent: AgendaSectionResolvers["relatedEvent"] = async (
  parent,
) => {
  return Event.findOne(parent.relatedEvent).lean();
};
