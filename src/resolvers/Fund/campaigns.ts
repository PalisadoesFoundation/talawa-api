import { FundraisingCampaign } from "../../models";
import type { FundResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the campaigns assoicated with the fund from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all campaigns associated with the fund.
 */
export const campaigns: FundResolvers["campaigns"] = async (parent) => {
  return await FundraisingCampaign.find({
    fundId: parent._id,
  }).lean();
};
