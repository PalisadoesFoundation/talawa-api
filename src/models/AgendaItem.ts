import type { Types, Document, PopulatedDoc, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceAgendaCategory } from "./AgendaCategory";
import type { InterfaceEvent } from "./Event";
import type { InterfaceNote } from "./Note";

/**
 * Represents a document for an agenda item in the MongoDB database.
 */
export interface InterfaceAgendaItem {
  _id: Types.ObjectId; // Unique identifier for the agenda item.
  title: string; // Title of the agenda item.
  description?: string; // Optional description of the agenda item.
  duration: string; // Duration of the agenda item.
  attachments?: string[]; // Optional array of attachment URLs.
  createdBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who created the agenda item.
  updatedBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who last updated the agenda item.
  urls?: string[]; // Optional array of URLs related to the agenda item.
  users?: PopulatedDoc<InterfaceUser & Document>[]; // Optional users array indicating key note users for the agenda item.
  relatedEvent: PopulatedDoc<InterfaceEvent & Document>; // Reference to the event associated with the agenda item.
  categories?: PopulatedDoc<InterfaceAgendaCategory & Document>[]; // Optional array of agenda categories associated with the agenda item.
  sequence: number; // Sequence number of the agenda item.
  itemType: ItemType; // Type of the agenda item (Regular or Note).
  createdAt: Date; // Date when the agenda item was created.
  updatedAt: Date; // Date when the agenda item was last updated.
  organization: PopulatedDoc<InterfaceOrganization & Document>; // Reference to the organization associated with the agenda item.
  notes: PopulatedDoc<InterfaceNote & Document>[]; // Reference to the notes associated with the agenda item.
}

/**
 * Enumeration representing the types of agenda items.
 */
export enum ItemType {
  Regular = "Regular", // Regular agenda item type.
  Note = "Note", // Note agenda item type.
}

/**
 * Mongoose schema definition for an agenda item document.
 * @param title - Title of the agenda item.
 * @param description - Optional description of the agenda item.
 * @param relatedEventId - Reference to the event associated with the agenda item.
 * @param duration - Duration of the agenda item.
 * @param attachments - Optional array of attachment URLs.
 * @param createdBy - Reference to the user who created the agenda item.
 * @param updatedBy - Reference to the user who last updated the agenda item.
 * @param urls - Optional array of URLs related to the agenda item.
 * @param users - Optional array of users associated with the agenda item.
 * @param categories - Optional array of agenda categories associated with the agenda item.
 * @param sequence - Sequence number of the agenda item.
 * @param itemType - Type of the agenda item (Regular or Note).
 * @param createdAt - Date when the agenda item was created.
 * @param updatedAt - Date when the agenda item was last updated.
 * @param organizationId - Reference to the organization associated with the agenda item.
 * @param notes - Array of notes associated with the agenda item.
 */
export const AgendaItemSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  relatedEventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
  },
  duration: {
    type: String,
    required: true,
  },
  attachments: {
    type: [String],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  urls: {
    type: [String],
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: "AgendaCategory",
    },
  ],
  sequence: {
    type: Number,
  },
  itemType: {
    type: String,
    enum: Object.values(ItemType),
  },
  createdAt: {
    type: Date,
    // required: true,
  },
  updatedAt: {
    type: Date,
    // required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
  },
  notes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
  ],
});

/**
 * Returns the Mongoose Model for AgendaItem to prevent OverwriteModelError.
 */
const agendaItemModel = (): Model<InterfaceAgendaItem> =>
  model<InterfaceAgendaItem>("AgendaItem", AgendaItemSchema);

// Check if the AgendaItem model is already defined, if not, create a new one
export const AgendaItemModel = (models.AgendaItem ||
  agendaItemModel()) as ReturnType<typeof agendaItemModel>;
