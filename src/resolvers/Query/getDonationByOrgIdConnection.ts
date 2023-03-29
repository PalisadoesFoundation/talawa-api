import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Donation, Interface_Donation } from "../../models";
import { getInputArgs } from "./helperFunctions/getInputArgs";

export const getDonationByOrgIdConnection: QueryResolvers["getDonationByOrgIdConnection"] =
  async (_parent, args) => {
    const inputArg = getInputArgs<Interface_Donation>(args.where);

    return await Donation.find({
      orgId: args.orgId,
      ...inputArg,
    })
      .limit(args.first!)
      .skip(args.skip!)
      .lean();
  };
