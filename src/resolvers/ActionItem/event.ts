import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

/**
 * Resolver function for the `event` field of an `ActionItem`.
 *
 * This function retrieves the event associated with a specific action item.
 *
 * @param parent - The parent object representing the action item. It contains information about the action item, including the ID of the associated event.
 * @returns A promise that resolves to the event document found in the database. This document represents the event associated with the action item.
 *
 * @example
 * Here's how you might use this resolver in your GraphQL schema:
 *
 * ```graphql
 * type ActionItem {
 *   event: Event
 *   # other fields...
 * }
 * ```
 *
 * @example
 * If the action item with an ID of `123` is associated with an event with an ID of `789`, this resolver will find the event with the ID `789` in the database and return its information.
 *
 * @see Event - The Event model used to interact with the events collection in the database.
 * @see ActionItemResolvers - The type definition for the resolvers of the ActionItem fields.
 */
export const event: ActionItemResolvers["event"] = async (parent) => {
  return Event.findOne({
    _id: parent.eventId,
  }).lean();
};
