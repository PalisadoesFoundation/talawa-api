import type { FundCampaignResolvers } from "../../types/generatedGraphQLTypes";
import { Fund } from "../../models";
/**
 * This resolver function will fetch and return the Fund Campaign creator(User) from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */
export const parentFundId: FundCampaignResolvers["parentFundId"] = async (
  parent
) => {
  return await Fund.findOne({
    id: parent?.parentFundId?._id,
  }).lean();
};
