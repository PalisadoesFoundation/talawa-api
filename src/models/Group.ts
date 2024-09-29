import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * Interface representing a document for a group in the database (MongoDB).
 */
export interface InterfaceGroup {
  _id: Types.ObjectId;
  title: string;
  description: string | undefined;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
  admins: PopulatedDoc<InterfaceUser & Document>[];
  createdAt: Date;
  updatedAt: Date;
}
/**
 * Mongoose schema for a group.
 * Defines the structure of the group document stored in MongoDB.
 * @param title - The title of the group.
 * @param description - A description of the group.
 * @param organization - The organization the group belongs to.
 * @param status - The status of the group (e.g., ACTIVE, BLOCKED, DELETED).
 * @param admins - The administrators of the group.
 * @param createdAt - The date and time when the group was created.
 * @param updatedAt - The date and time when the group was last updated.
 */
const groupSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Add logging middleware for groupSchema
createLoggingMiddleware(groupSchema, "Group");

/**
 * Function to retrieve or create the Mongoose model for the Group.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the Group.
 */
const groupModel = (): Model<InterfaceGroup> =>
  model<InterfaceGroup>("Group", groupSchema);

/**
 * The Mongoose model for the Group.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const Group = (models.Group || groupModel()) as ReturnType<
  typeof groupModel
>;
