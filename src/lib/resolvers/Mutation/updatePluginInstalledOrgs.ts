import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { Plugin } from "../../models";

/**
 * @name updatePluginInstalledOrgs
 * @description updates the installedOrgs list of the specific plugin and adds or removes the current orgId from the list.
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
 */
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
      _id: args.id,
    }).lean();

    const organizationHasPluginInstalled = plugin?.installedOrgs.some(
      (organization) => organization.toString() === args.orgId
    );

    /*
    Remove args.orgId from installedOrgs ifplugin is already installed for
    organization with _id === args.orgId
    */
    if (organizationHasPluginInstalled === true) {
      return await Plugin.findOneAndUpdate(
        {
          _id: args.id,
        },
        {
          $pull: {
            installedOrgs: args.orgId,
          },
        },
        {
          new: true,
        }
      ).lean();
    } else {
      return await Plugin.findOneAndUpdate(
        {
          _id: args.id,
        },
        {
          $push: {
            installedOrgs: args.orgId,
          },
        },
        {
          new: true,
        }
      ).lean();
    }
  };
