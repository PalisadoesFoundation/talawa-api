import type { FundCampaignResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
/**
 * This resolver function will fetch and return the Group Chat creator(User) from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */
export const creator: FundCampaignResolvers["creator"] = async (parent) => {
  return await User.findOne({
    id: parent?.creator,
  }).lean();
};
