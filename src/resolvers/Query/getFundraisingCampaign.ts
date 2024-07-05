import {
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
<<<<<<< HEAD
=======
import { getSort } from "./helperFunctions/getSort";
>>>>>>> develop
/**
 * This query will fetch the fundraisingCampaign as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the campaign.
 * @returns A `fundraisingCampaign` object.
 */ //@ts-expect-error - type error
export const getFundraisingCampaignById: QueryResolvers["getFundraisingCampaignById"] =
  async (_parent, args) => {
<<<<<<< HEAD
    const campaign = await FundraisingCampaign.findOne({
      _id: args.id,
    }).lean();
=======
    const sort = getSort(args.orderBy);
    const campaign = await FundraisingCampaign.findOne({
      _id: args.id,
    })
      .populate("fundId")
      .populate({
        path: "pledges",
        populate: {
          path: "users",
        },
        options: {
          sort: sort,
        },
      })
      .lean();
>>>>>>> develop

    return campaign ?? ({} as InterfaceFundraisingCampaign);
  };
