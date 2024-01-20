import type { FundCampaignResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceUser } from "../../models";
import { User } from "../../models";

/**
 * This resolver function will fetch and return the Fund Campaign creator(User) from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the User data.
 */

export const creator: FundCampaignResolvers["creator"] = async (
  parent
): Promise<InterfaceUser> => {
  return await User.findById(parent.creator).lean();
};
