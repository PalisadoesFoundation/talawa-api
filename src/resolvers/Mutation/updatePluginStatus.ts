import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";
import mongoose from "mongoose";
import { TRANSACTION_LOG_TYPES } from "../../constants";
import { storeTransaction } from "../../utilities/storeTransaction";

/**
 * This function enables to update plugin install status.
 * @param _parent - parent of current request
 * @param args - payload provided with the request contains _id of the plugin and orgID of the org that wants to change it's status.
 * @param _context - context of entire application
 * @returns Updated PLugin status.
 */

// @ts-ignore
export const updatePluginStatus: MutationResolvers["updatePluginStatus"] =
  async (_parent, args, context) => {
    const uid = args.id;
    // const currOrgID = mongoose.Types.ObjectId(args.orgId) ;
    const currOrgID = args.orgId;

    const plugin = await Plugin.findById(uid);

    if (!plugin) {
      console.log("Document not found");
      return;
    }

    let uninstalledOrgsList = plugin.uninstalledOrgs;
    // @ts-ignore
    if (uninstalledOrgsList.includes(currOrgID)) {
      //if already uninstalled then install it by removing from array
      uninstalledOrgsList = uninstalledOrgsList.filter(
        (oid: any) => oid != currOrgID
      );
    } else {
      //not already present then uninstall plugin on that org by adding it to the list
      uninstalledOrgsList.push(mongoose.Types.ObjectId(currOrgID));
    }
    plugin.uninstalledOrgs = uninstalledOrgsList;

    const res = await Plugin.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(uid),
      },
      {
        ...plugin,
      },
      {
        new: true,
      }
    ).lean();
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Plugin",
      `Plugin:${args.id} updated`
    );
    // calls subscription
    context.pubsub.publish("TALAWA_PLUGIN_UPDATED", {
      Plugin: res,
    });
    return res;
  };
