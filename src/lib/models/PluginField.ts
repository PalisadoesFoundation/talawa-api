import { Schema, model, Types, models } from "mongoose";

/**
 * This is an interface that represents a database(MongoDB) document for Plugin Field.
 */
export interface Interface_PluginField {
  _id: Types.ObjectId;
  key: string;
  value: string;
  status: string;
  createdAt: Date;
}

/**
 * This describes the schema for a `PluginField` that corresponds to `Interface_PluginField` document.
 * @param key - Plugin key.
 * @param value - Value.
 * @param status - Status.
 * @param createdAt - Time stamp of data creation.
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

// creates a model.
const PluginFieldModel = () =>
  model<Interface_PluginField>("PluginField", pluginFieldSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const PluginField = (models.PluginField ||
  PluginFieldModel()) as ReturnType<typeof PluginFieldModel>;
