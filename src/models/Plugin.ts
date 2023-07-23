import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
/**
 * This is an interface that represents a database(MongoDB) document for Plugin.
 */
export interface InterfacePlugin {
  _id: Types.ObjectId;
  pluginName: string;
  pluginCreatedBy: string;
  pluginDesc: string;
  uninstalledOrgs: Types.ObjectId[];
}

/**
 * @param  pluginName- Name of the plugin preferred having underscores "_",(type: String)
 * @param pluginCreatedBy- name of the plugin creator ex.John Doe,(type: String)
 * @param pluginDesc- brief description of the plugin and it's features,(type: String)
 * @param uninstalledOrgs - list of orgIDs which have disabled the feature on mobile app,(type: String[])
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

const pluginModel = (): Model<InterfacePlugin> =>
  model<InterfacePlugin>("Plugin", pluginSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Plugin = (models.Plugin || pluginModel()) as ReturnType<
  typeof pluginModel
>;
