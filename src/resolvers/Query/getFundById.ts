import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This query will fetch the fund as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the fund.
 * @returns A `fund` object.
 */

// @ts-ignore
export const getFundById: QueryResolvers["getFundById"] = async (
  _parent,
  args,
) => {
  const fund = await Fund.findOne({
    _id: args.id,
  }).lean();

  // If fund not found, return an empty object
  if (!fund) {
    return {};
  }

  return fund as InterfaceFund;
};
