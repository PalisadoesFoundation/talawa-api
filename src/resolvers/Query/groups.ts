import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Group } from "../../models";
/**
 * This query fetch all the groups from the database.
 * @returns An object containing a list of all groups.
 */
export const groups: QueryResolvers["groups"] = async () => {
  return await Group.find().lean();
};
