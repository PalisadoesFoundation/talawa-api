import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Fund } from "../../models";

/**
 * This query will fetch all the funds.
 * @param _parent-
 * @param args -
 * @returns A `fund` object.
 */

export const getFunds: QueryResolvers["getFunds"] = async () => {
  return await Fund.find().lean();
};
