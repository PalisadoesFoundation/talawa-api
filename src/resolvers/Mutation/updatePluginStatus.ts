import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";

/**
 * @name updatePluginStatus
 * @description toggles the installStatus of the plugin
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
 */

export const updatePluginStatus: MutationResolvers["updatePluginStatus"] =
  async (_parent, args, _context) => {
    return await Plugin.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        pluginInstallStatus: args.status,
      },
      {
        new: true,
      }
    ).lean();
  };
