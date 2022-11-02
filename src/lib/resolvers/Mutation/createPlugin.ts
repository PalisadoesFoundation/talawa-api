import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { Plugin } from "../../models";

/**
 * @name createPlugin creates a Plugin and return the same
 * @description creates a document of Plugin type and stores it in database
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
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
