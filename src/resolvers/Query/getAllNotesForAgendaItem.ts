import type { InterfaceNote } from "../../models";
import { NoteModel } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

export const getAllNotesForAgendaItem: QueryResolvers["getAllNotesForAgendaItem"] =
  async (_parent, args) => {
    console.log(_parent);
    console.log(args);

    // Fetch all notes for a specific agenda item from the database
    const allNotesForAgendaItem = await NoteModel.find({
      agendaItemId: args.agendaItemId,
    })
      .lean()
      .exec();
    return allNotesForAgendaItem as InterfaceNote[];
  };
