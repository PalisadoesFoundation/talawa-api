import type { InterfaceNote } from "../../models";
import { NoteModel } from "../../models";
import { errors } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { NOTE_NOT_FOUND_ERROR } from "../../constants";
/**
 * Retrieves a note by its ID from the database.
 *
 * This function performs the following steps:
 * 1. Queries the database to find a `Note` record by the provided ID.
 * 2. If the note is not found, throws a `NotFoundError` with a predefined error message.
 * 3. Returns the note record if found.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including:
 *   - `id`: The ID of the note to be retrieved.
 *
 * @returns The note record corresponding to the provided ID.
 *
 */

export const getNoteById: QueryResolvers["getNoteById"] = async (
  _parent,
  args,
) => {
  const note = await NoteModel.findById(args.id).lean();

  if (!note) {
    throw new errors.NotFoundError(
      NOTE_NOT_FOUND_ERROR.MESSAGE,
      NOTE_NOT_FOUND_ERROR.CODE,
      NOTE_NOT_FOUND_ERROR.PARAM,
    );
  }

  return note as InterfaceNote;
};
