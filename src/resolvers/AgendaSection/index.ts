import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { createdBy } from "./createdBy";
import { items } from "./items";
import { relatedEvent } from "./relatedEvent";

/**
 * Resolver function for the `AgendaSection` type.
 *
 * This resolver is used to resolve the fields of an `AgendaSection` type.
 *
 * @see relatedEvent - The resolver function for the `relatedEvent` field of an `AgendaSection`.
 * @see items - The resolver function for the `items` field of an `AgendaSection`.
 * @see createdBy - The resolver function for the `createdBy` field of an `AgendaSection`.
 * @see AgendaSectionResolvers - The type definition for the resolvers of the AgendaSection fields.
 *
 */
export const AgendaSection: AgendaSectionResolvers = {
  relatedEvent,
  items,
  createdBy,
};
