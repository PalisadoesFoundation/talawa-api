import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";

/**
 * Creates a new plugin and triggers a subscription event.
 *
 * This resolver performs the following steps:
 *
 * 1. Creates a new plugin using the provided arguments.
 * 2. Publishes an update event to the `TALAWA_PLUGIN_UPDATED` subscription channel with the created plugin details.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, which include:
 *   - `data`: An object containing the plugin's details.
 * @param _context - The context object, which includes the pubsub system for triggering subscriptions.
 *
 * @returns The created plugin object.
 *
 * @remarks This function creates a plugin record, updates the subscription channel with the new plugin details, and returns the created plugin.
 */
export const createPlugin: MutationResolvers["createPlugin"] = async (
  _parent,
  args,
  context,
) => {
  // Creates new plugin.
  const createdPlugin = await Plugin.create({
    ...args,
    uninstalledOrgs: [],
  });

  // Calls subscription
  context.pubsub.publish("TALAWA_PLUGIN_UPDATED", {
    onPluginUpdate: createdPlugin.toObject(),
  });

  // Returns createdPlugin.
  return createdPlugin.toObject();
};
