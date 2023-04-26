import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Donation, InterfaceDonation } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";

export const getDonationByOrgIdConnection: QueryResolvers["getDonationByOrgIdConnection"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceDonation>(args.where);

    return await Donation.find({
      orgId: args.orgId,
      ...where,
    })
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .lean();
  };
