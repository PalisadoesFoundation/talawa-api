import { User } from "../../models";
import type { FundraisingCampaignPledgeResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `users` field of a `FundraisingCampaignPledge`.
 *
 * This function retrieves the users who pledged to donate to a specific fundraising campaign.
 *
 * @param parent - The parent object representing the fundraising campaign pledge. It contains information about the fundraising campaign pledge, including the IDs of the users who pledged to donate.
 * @returns A promise that resolves to an array of user documents found in the database. These documents represent the users who pledged to donate to the fundraising campaign.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see FundraisingCampaignPledgeResolvers - The type definition for the resolvers of the FundraisingCampaignPledge fields.
 *
 */
export const users: FundraisingCampaignPledgeResolvers["users"] = async (
  parent,
) => {
  return await User.find({
    _id: { $in: parent.users.map(String) },
  }).lean();
};
