import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";

/**
 * This function enables to update plugin status.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param _context - context of entire application
 * @returns Updated PLugin status.
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
