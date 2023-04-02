import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";

/**
 * This function enables to update plugin installed organizations.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param _context - context of entire application
 * @returns Updated plugin.
 */

export const updatePluginInstalledOrgs: MutationResolvers["updatePluginInstalledOrgs"] =
  async (_parent, args, _context) => {
    const plugin = await Plugin.findOne({
      _id: args.input.id,
    }).lean();

    const organizationHasPluginInstalled = plugin?.installedOrgs.some(
      (organization) => organization.equals(args.input.orgId)
    );

    /*
    Remove args.input.orgId from installedOrgs ifplugin is already installed for
    organization with _id === args.input.orgId
    */

    if (organizationHasPluginInstalled) {
      return await Plugin.findOneAndUpdate(
        {
          _id: args.input.id,
        },
        {
          $pull: {
            installedOrgs: args.input.orgId,
          },
        },
        {
          new: true,
        }
      ).lean();
    } else {
      return await Plugin.findOneAndUpdate(
        {
          _id: args.input.id,
        },
        {
          $push: {
            installedOrgs: args.input.orgId,
          },
        },
        {
          new: true,
        }
      ).lean();
    }
  };
