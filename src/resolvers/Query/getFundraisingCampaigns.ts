import { FundraisingCampaign } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";
/**
 * This query will fetch the fundraisingCampaign as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the campaign.
 * @returns A `fundraisingCampaign` object.
 */
export const getFundraisingCampaigns: QueryResolvers["getFundraisingCampaigns"] =
  async (_parent, args) => {
    const sortPledge = getSort(args.pledgeOrderBy);
    const sortCampaign = getSort(args.campaignOrderby);
    const where = getWhere(args.where);
    const campaigns = await FundraisingCampaign.find({
      ...where,
    })
      .sort(sortCampaign)
      .populate("fundId")
      .populate({
        path: "pledges",
        populate: {
          path: "users",
        },
        options: {
          sort: sortPledge,
        },
      });

    return campaigns;
  };
