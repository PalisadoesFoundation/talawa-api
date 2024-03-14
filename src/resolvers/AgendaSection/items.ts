import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaItemModel } from "../../models";

export const items: AgendaSectionResolvers["items"] = async (parent) => {
  const relatedAgendaItemIds = parent.items;

  const relatedAgendaItems = await AgendaItemModel.find({
    _id: { $in: relatedAgendaItemIds },
  }).lean();

  return relatedAgendaItems;
};
