import { AgendaItemModel } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

export const getAllAgendaItems: QueryResolvers["getAllAgendaItems"] = async (
  _parent,
  _args,
) => {
  console.log(_parent);
  console.log(_args);

  // Fetch all agenda items from the database
  const allAgendaItems = await AgendaItemModel.find().lean().exec();
  return allAgendaItems;
};
