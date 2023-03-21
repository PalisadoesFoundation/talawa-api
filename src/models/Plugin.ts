import { Schema, Types, model, models } from "mongoose";
/**
 * This is an interface that represents a database(MongoDB) document for Plugin.
 */
export interface Interface_Plugin {
  _id: Types.ObjectId;
  pluginName: string;
  pluginCreatedBy: string;
  pluginDesc: string;
  pluginInstallStatus: boolean;
  installedOrgs: Array<Types.ObjectId>;
}

/**
 * @param pluginName - Name of the plugin preferred having underscores "_",(Type:string)
 * @param  pluginCreatedBy - name of the plugin creator ex.John Doe,(Type:string)
 * @param pluginDesc - brief description of the plugin and it's features,(Type:string)
 * @param  pluginInstallStatus - shows if the plugin is enabled or not,(Type:Boolean)
 * @param installedOrgs - list of orgIDs on which the plugin is enabled,(Type:String[])
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

const PluginModel = () => model<Interface_Plugin>("Plugin", pluginSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Plugin = (models.Plugin || PluginModel()) as ReturnType<
  typeof PluginModel
>;
