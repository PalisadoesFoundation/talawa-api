import type { PopulatedDoc, Model, Types, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";

/**
 * Represents a document for an agenda category in the MongoDB database.
 */
export interface InterfaceAgendaCategory {
  _id: Types.ObjectId; // Unique identifier for the agenda category.
  name: string; // Name of the agenda category.
  description?: string; // Optional description of the agenda category.
  organizationId: PopulatedDoc<InterfaceOrganization & Document>; // Reference to the organization associated with the agenda category.
  createdBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who created the agenda category.
  updatedBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who last updated the agenda category.
  createdAt: Date; // Date when the agenda category was created.
  updatedAt: Date; // Date when the agenda category was last updated.
}

/**
 * Mongoose schema definition for an agenda category document.
 * @param name - Name of the agenda category.
 * @param description - Optional description of the agenda category.
 * @param organizationId - Reference to the organization associated with the agenda category.
 * @param createdBy - Reference to the user who created the agenda category.
 * @param updatedBy - Reference to the user who last updated the agenda category.
 * @param createdAt - Date when the agenda category was created.
 * @param updatedAt - Date when the agenda category was last updated.
 */
export const AgendaCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
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
});

/**
 * Returns the Mongoose Model for AgendaCategory to prevent OverwriteModelError.
 */
const agendaCategoryModel = (): Model<InterfaceAgendaCategory> =>
  model<InterfaceAgendaCategory>("AgendaCategory", AgendaCategorySchema);

// Check if the AgendaItem model is already defined, if not, create a new one
export const AgendaCategoryModel = (models.AgendaCategory ||
  agendaCategoryModel()) as ReturnType<typeof agendaCategoryModel>;
