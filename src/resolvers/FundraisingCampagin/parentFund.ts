import { Types } from "mongoose";
import { Fund, type InterfaceFund } from "../../models";
import type { FundraisingCampaignResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This resolver will fetch the fund as a transaction from database.
 * @param parent - A `fund` object.
 * @returns A `fund` object.
 */
export const fundId: FundraisingCampaignResolvers["fundId"] = async (
  parent,
) => {
  return (await Fund.findOne({
    _id: Types.ObjectId(parent.fundId?.toString()),
  })) as InterfaceFund;
};
