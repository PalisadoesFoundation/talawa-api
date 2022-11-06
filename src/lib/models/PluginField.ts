import { Schema, model, Types, models } from "mongoose";

export interface Interface_PluginField {
  _id: Types.ObjectId;
  key: string;
  value: string;
  status: string;
  createdAt: Date;
}

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

const PluginFieldModel = () =>
  model<Interface_PluginField>("PluginField", pluginFieldSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const PluginField = (models.PluginField ||
  PluginFieldModel()) as ReturnType<typeof PluginFieldModel>;
