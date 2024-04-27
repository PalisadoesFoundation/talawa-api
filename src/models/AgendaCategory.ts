import type { PopulatedDoc, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for an agenda category in the database (MongoDB).
 */
export interface InterfaceAgendaCategory {
  _id: Types.ObjectId; // Unique identifier for the agenda category.
  name: string; // Name of the agenda category.
  description?: string; // Optional description of the agenda category.
  organizationId: PopulatedDoc<InterfaceOrganization & Document>; // Reference to the organization associated with the agenda category.
  createdBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who created the agenda category.
  updatedBy: PopulatedDoc<InterfaceUser & Document>; // Reference to the user who last updated the agenda category.
}

/**
 * This is the Mongoose schema for an agenda category (test-change).
 * @param name - Name of the agenda category.
 * @param description - Optional description of the agenda category.
 * @param organization - Reference to the organization associated with the agenda category.
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

const agendaCategoryModel = (): Model<InterfaceAgendaCategory> =>
  model<InterfaceAgendaCategory>("AgendaCategory", AgendaCategorySchema);

// Check if the AgendaItem model is already defined, if not, create a new one
export const AgendaCategoryModel = (models.AgendaCategory ||
  agendaCategoryModel()) as ReturnType<typeof agendaCategoryModel>;
