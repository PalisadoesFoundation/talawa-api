import { User } from "../../models";
import type { FundraisingCampaignPledgeResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This resolver function will fetch and return the list of users who have pledged to the Fundraising Campaign from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all users who have pledged to the Fundraising Campaign.
 */
export const users: FundraisingCampaignPledgeResolvers["users"] = async (
  parent,
) => {
  return await User.find({
    _id: { $in: parent.users.map(String) },
  }).lean();
};
