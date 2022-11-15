import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Plugin } from "../../models";

/**
 * This function returns list of plugins from the database.
 * @returns An object that contains a list of plugins.
 */
export const getPlugins: QueryResolvers["getPlugins"] = async () => {
  return await Plugin.find().lean();
};
