import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a MongoDB document for Plugin in the database.
 */
export interface InterfacePlugin {
  _id: Types.ObjectId;
  pluginName: string;
  pluginCreatedBy: string;
  pluginDesc: string;
  uninstalledOrgs: Types.ObjectId[];
}

/**
 * Mongoose schema definition for Plugin documents.
 * @param pluginName - Name of the plugin preferred having underscores "_".
 * @param pluginCreatedBy - Name of the plugin creator (e.g., "John Doe").
 * @param pluginDesc - Brief description of the plugin and its features.
 * @param uninstalledOrgs - List of organization IDs which have disabled the feature on mobile app.
 */

const pluginSchema = new Schema({
  pluginName: {
    type: String,
    required: true,
  },
  pluginCreatedBy: {
    type: String,
    required: true,
  },
  pluginDesc: {
    type: String,
    required: true,
  },
  uninstalledOrgs: [
    {
      type: Schema.Types.ObjectId,
      required: false,
      default: [],
    },
  ],
});

/**
 * Middleware to log database operations on the Plugin collection.
 */
createLoggingMiddleware(pluginSchema, "Plugin");

const pluginModel = (): Model<InterfacePlugin> =>
  model<InterfacePlugin>("Plugin", pluginSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Plugin = (models.Plugin || pluginModel()) as ReturnType<
  typeof pluginModel
>;
