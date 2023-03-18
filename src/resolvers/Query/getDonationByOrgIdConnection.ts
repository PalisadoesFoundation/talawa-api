import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Donation, Interface_Donation } from "../../models";
import { FilterQuery } from "mongoose";
import { getInputArgs } from "./helperFunctions/getInputArgs";

/**
 * @name getDonationByOrgIdConnection a GraphQL Query
 * @description returns list of donations as a transactions that matches the provided orgId property from database and all the query parameters
 */
export const getDonationByOrgIdConnection: QueryResolvers["getDonationByOrgIdConnection"] =
  async (_parent, args) => {
    const inputArg: FilterQuery<Interface_Donation> = getInputArgs(args.where);

    return await Donation.find({
      orgId: args.orgId,
      ...inputArg,
    })
      .limit(args.first!)
      .skip(args.skip!)
      .lean();
  };
