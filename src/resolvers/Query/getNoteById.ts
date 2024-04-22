import type { InterfaceNote } from "../../models";
import { NoteModel } from "../../models";
import { errors } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { NOTE_NOT_FOUND_ERROR } from "../../constants";

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
