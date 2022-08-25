import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_Plugin {
  pluginName: string;
  pluginCreatedBy: string;
  pluginDesc: string;
  pluginInstallStatus: boolean;
  installedOrgs: Array<Types.ObjectId>;
}

/**
 * @name pluginSchema
 * @description Schema for MongoDB database
 * @param  {string} pluginName Name of the plugin preferred having underscores "_"
 * @param {string} pluginCreatedBy name of the plugin creator ex.John Doe
 * @param {string} pluginDesc brief description of the plugin and it's features
 * @param {Boolean} pluginInstallStatus shows if the plugin is enabled or not
 * @param {String[]} installedOrgs list of orgIDs on which the plugin is enabled
 */
const pluginSchema = new Schema<
  Interface_Plugin,
  Model<Interface_Plugin>,
  Interface_Plugin
>({
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
  pluginInstallStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  installedOrgs: [
    {
      type: Schema.Types.ObjectId,
      required: false,
      default: [],
    },
  ],
});

export const Plugin = model<Interface_Plugin>('PluginTemp', pluginSchema);
