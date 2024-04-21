import type { Model, PopulatedDoc, Types} from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";

export interface InterfaceNote {
  _id: Types.ObjectId; // Unique identifier for the note.
  content: string; // Content of the note.
  createdBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who created the note.
  updatedBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who last updated the note.
  createdAt: Date; // Date when the note was created.
  updatedAt: Date; // Date when the note was last updated.
  agendaItemId: Types.ObjectId; // Reference to the agenda item associated with the note.
}

export const NoteSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  agendaItemId: {
    type: Schema.Types.ObjectId,
    ref: "AgendaItem",
    required: true,
  },
});

const noteModel = (): Model<InterfaceNote> =>
  model<InterfaceNote>("Note", NoteSchema);

export const NoteModel = (models.Note || noteModel()) as ReturnType<
  typeof noteModel
>;
