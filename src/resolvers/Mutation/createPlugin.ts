import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";

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
  // calls subscription
  context.pubsub.publish("TALAWA_PLUGIN_UPDATED", {
    onPluginUpdate: createdPlugin.toObject(),
  });

  // Returns createdPlugin.
  return createdPlugin.toObject();
};
