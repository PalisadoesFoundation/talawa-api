import type { Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";

/**
 * Represents a note document in the database.
 */
export interface InterfaceNote {
  _id: Types.ObjectId; // Unique identifier for the note.
  content: string; // Content of the note.
  createdBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who created the note.
  updatedBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who last updated the note.
  createdAt: Date; // Date when the note was created.
  updatedAt: Date; // Date when the note was last updated.
  agendaItemId: Types.ObjectId; // Reference to the agenda item associated with the note.
}

/**
 * Mongoose schema definition for Note documents.
 * @param content - The content of the note.
 * @param createdBy - The ID of the user who created the note.
 * @param updatedBy - Optional: The ID of the user who last updated the note.
 * @param createdAt - The date when the note was created.
 * @param updatedAt - Optional: The date when the note was last updated.
 * @param agendaItemId - The ID of the agenda item associated with the note.
 */
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

/**
 * Mongoose model for Note documents.
 */
const noteModel = (): Model<InterfaceNote> =>
  model<InterfaceNote>("Note", NoteSchema);

// Exporting the Note model while preventing Mongoose OverwriteModelError during tests.
export const NoteModel = (models.Note || noteModel()) as ReturnType<
  typeof noteModel
>;
