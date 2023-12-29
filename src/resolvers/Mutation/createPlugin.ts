import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";

/**
 * This function enables to create a plugin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param _context - context of entire application
 * @returns Created plugin
 */

export const createPlugin: MutationResolvers["createPlugin"] = async (
  _parent,
  args,
  context
) => {
  // Creates new plugin.
  const createdPlugin = await Plugin.create({
    ...args,
    uninstalledOrgs: [],
  });
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "Plugin",
    `Plugin:${createdPlugin._id} created`
  );

  // calls subscription
  context.pubsub.publish("TALAWA_PLUGIN_UPDATED", {
    Plugin: createdPlugin.toObject(),
  });

  // Returns createdPlugin.
  return createdPlugin.toObject();
};
