import { MutationResolvers } from "../../../generated/graphqlCodegen";
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
  _context
) => {
  // Creates new plugin.
  const createdPlugin = await Plugin.create({
    ...args,
  });

  // Returns createdPlugin.
  return createdPlugin.toObject();
};
