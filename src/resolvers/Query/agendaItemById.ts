import { AgendaItemModel } from "../../models";
import { errors } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AGENDA_ITEM_NOT_FOUND_ERROR } from "../../constants";

export const getAgendaItem: QueryResolvers["getAgendaItem"] = async (
  _parent,
  args,
) => {
  const agendaItem = await AgendaItemModel.findById(args.id).lean();

  if (!agendaItem) {
    throw new errors.NotFoundError(
      AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE,
      AGENDA_ITEM_NOT_FOUND_ERROR.CODE,
      AGENDA_ITEM_NOT_FOUND_ERROR.PARAM,
    );
  }

  return agendaItem;
};
