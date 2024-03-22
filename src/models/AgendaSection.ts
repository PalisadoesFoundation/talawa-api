import type { Types, Document, PopulatedDoc, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import { type InterfaceAgendaItem } from "./AgendaItem";
import type { InterfaceEvent } from "./Event";
/**
 * This is an interface representing a document for an agenda section in the database (MongoDB).
 */
export interface InterfaceAgendaSection {
  _id: Types.ObjectId; // Unique identifier for the agenda section.
  relatedEvent: PopulatedDoc<InterfaceEvent & Document>; // Reference to the event associated with the agenda section.
  description: string; // Description of the agenda section.
  items: PopulatedDoc<InterfaceAgendaItem & Document>[]; // Array of agenda items associated with the agenda section.
  sequence: number; // Sequence number of the agenda section.
  createdAt: Date; // Date when the agenda section was created.
  updatedAt: Date; // Date when the agenda section was last updated.
  createdBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who created the agenda section.
  updatedBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who last updated the agenda section.
}

/**
 * This is the Mongoose schema for an agenda section.
 * @param relatedEvent - Reference to the event associated with the agenda section.
 * @param description - Description of the agenda section.
 * @param items - Array of agenda items associated with the agenda section.
 * @param sequence - Sequence number of the agenda section.
 * @param createdBy - Reference to the user who created the agenda section.
 * @param createdAt - Date when the agenda section was created.
 * @param updatedAt - Date when the agenda section was last updated.
 */
export const AgendaSectionSchema = new Schema({
  relatedEvent: {
    type: Schema.Types.ObjectId,
    ref: "Event",
  },
  description: {
    type: String,
    required: true,
  },
  items: [
    {
      type: Schema.Types.ObjectId,
      ref: "AgendaItem",
    },
  ],
  sequence: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

const agendaSectionModel = (): Model<InterfaceAgendaSection> =>
  model<InterfaceAgendaSection>("AgendaSection", AgendaSectionSchema);

// Check if the AgendaItem model is already defined, if not, create a new one
export const AgendaSectionModel = (models.AgendaSection ||
  agendaSectionModel()) as ReturnType<typeof agendaSectionModel>;
