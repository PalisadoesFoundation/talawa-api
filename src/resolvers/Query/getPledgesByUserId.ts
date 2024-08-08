import { USER_NOT_AUTHORIZED_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceFundraisingCampaign, InterfaceUser } from "../../models";
import { AppUserProfile } from "../../models";
import { type InterfaceFundraisingCampaignPledges } from "../../models/FundraisingCampaignPledge";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";

/**
 * This query will fetch the fundraisingCampaignPledge as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the fund.
 * @returns An array of `fundraisingCampaignPledge` object.
 */
export const getPledgesByUserId: QueryResolvers["getPledgesByUserId"] = async (
  _parent,
  args,
) => {
  const sort = getSort(args.orderBy);

  const appUserProfile = await AppUserProfile.findOne({
    userId: args.userId,
  }).populate({
    path: "pledges",
    options: {
      sort,
    },
    populate: [
      {
        path: "campaign",
      },
      {
        path: "users",
      },
    ],
  });

  if (!appUserProfile) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Filter the pledges based on campaign name
  if (args.where?.name_contains) {
    appUserProfile.pledges = appUserProfile.pledges.filter((pledge) => {
      const tempPledge = pledge as InterfaceFundraisingCampaignPledges;
      const campaign = tempPledge.campaign as InterfaceFundraisingCampaign;
      return campaign.name.includes(args?.where?.name_contains as string);
    });
  }

  // Filter the pledges based on pledger's name
  if (args.where?.firstName_contains) {
    appUserProfile.pledges = appUserProfile.pledges.filter((pledge) => {
      const tempPledge = pledge as InterfaceFundraisingCampaignPledges;
      const users = tempPledge.users as InterfaceUser[];
      return users.some((user) =>
        user.firstName.includes(args?.where?.firstName_contains as string),
      );
    });
  }

  return appUserProfile.pledges as InterfaceFundraisingCampaignPledges[];
};
