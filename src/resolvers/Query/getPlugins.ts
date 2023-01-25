import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";

/**
 * @name getPlugins a GraphQL Query
 * @description returns list of plugin from database
 */
export const getPlugins: QueryResolvers["getPlugins"] = async () => {
  return await Plugin.find().lean();
};
