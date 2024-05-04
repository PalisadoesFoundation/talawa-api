import mongoose from "mongoose";
import { PLUGIN_NOT_FOUND } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfacePlugin } from "../../models";
import { Plugin } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to update plugin install status.
 * @param _parent - parent of current request
 * @param args - payload provided with the request contains _id of the plugin and orgID of the org that wants to change it's status.
 * @param _context - context of entire application
 * @returns Updated PLugin status.
 */
export const updatePluginStatus: MutationResolvers["updatePluginStatus"] =
  async (_parent, args, context): Promise<InterfacePlugin> => {
    const uid = args.id;
    // const currOrgID = mongoose.Types.ObjectId(args.orgId) ;
    const currOrgID = args.orgId;

    const plugin = await Plugin.findById(uid);

    if (!plugin) {
      throw new errors.NotFoundError(
        requestContext.translate(PLUGIN_NOT_FOUND.MESSAGE),
        PLUGIN_NOT_FOUND.CODE,
        PLUGIN_NOT_FOUND.PARAM,
      );
    }

    let uninstalledOrgsList = plugin.uninstalledOrgs;

    if (uninstalledOrgsList.includes(new mongoose.Types.ObjectId(currOrgID))) {
      //if already uninstalled then install it by removing from array
      uninstalledOrgsList = uninstalledOrgsList.filter(
        (oid: unknown) => oid != currOrgID,
      );
    } else {
      //not already present then uninstall plugin on that org by adding it to the list
      uninstalledOrgsList.push(new mongoose.Types.ObjectId(currOrgID));
    }
    plugin.uninstalledOrgs = uninstalledOrgsList;

    const res = await Plugin.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(uid),
      },
      {
        ...plugin,
      },
      {
        new: true,
      },
    ).lean();

    // calls subscription
    context.pubsub.publish("TALAWA_PLUGIN_UPDATED", {
      onPluginUpdate: res,
    });
    return res as InterfacePlugin;
  };
