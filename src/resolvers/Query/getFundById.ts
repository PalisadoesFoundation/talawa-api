import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This query will fetch the fund as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the fund.
 * @returns A `fund` object.
 */
export const getFundById: QueryResolvers["getFundById"] = async (
  _parent,
  args,
) => {
  const fund = await Fund.findOne({
    _id: args.id,
  }).lean();

  return fund ?? ({} as InterfaceFund);
};
