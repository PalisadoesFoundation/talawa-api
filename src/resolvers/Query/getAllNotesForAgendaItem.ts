import type { InterfaceNote } from "../../models";
import { NoteModel } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * Retrieves all notes associated with a specific agenda item from the database.
 *
 * This function performs the following steps:
 * 1. Queries the database for notes that are associated with the specified agenda item ID.
 * 2. Returns the list of notes for the given agenda item.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including the agenda item ID (`agendaItemId`) for which notes are to be retrieved.
 *
 * @returns A list of notes associated with the specified agenda item.
 */

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
