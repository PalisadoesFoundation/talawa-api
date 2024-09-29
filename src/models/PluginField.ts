import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for a Plugin Field in the database (MongoDB).
 */
export interface InterfacePluginField {
  _id: Types.ObjectId;
  key: string;
  value: string;
  status: string;
  createdAt: Date;
}

/**
 * Mongoose schema for a Plugin Field.
 * Defines the structure of the Plugin Field document stored in MongoDB.
 * @param key - Plugin key.
 * @param value - Value associated with the plugin key.
 * @param status - Status of the plugin field.
 * @param createdAt - Timestamp of data creation.
 */
const pluginFieldSchema = new Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add logging middleware for pluginFieldSchema
createLoggingMiddleware(pluginFieldSchema, "PluginField");

/**
 * Function to retrieve or create the Mongoose model for the Plugin Field.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the Plugin Field.
 */
const pluginFieldModel = (): Model<InterfacePluginField> =>
  model<InterfacePluginField>("PluginField", pluginFieldSchema);

/**
 * The Mongoose model for the Plugin Field.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const PluginField = (models.PluginField ||
  pluginFieldModel()) as ReturnType<typeof pluginFieldModel>;
