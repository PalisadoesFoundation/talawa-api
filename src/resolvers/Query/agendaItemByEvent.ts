import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaItemModel } from "../../models";

/**
 * This query will fetch all items for the organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization.
 * @returns A `Item` object that holds all Item for the Organization.
 */
export const agendaItemByEvent: QueryResolvers["agendaItemByEvent"] = async (
  _parent,
  args,
) => {
  return await AgendaItemModel.find({
    relatedEventId: args.relatedEventId,
  })
    .sort({ sequence: 1 })
    .lean();
};
