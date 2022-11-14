import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";


/**
 * This function enables to create a donation as transaction
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns Created Donation
 */
export const createDonation: MutationResolvers["createDonation"] = async (
  _parent,
  args
) => {
  const createdDonation = await Donation.create({
    amount: args.amount,
    nameOfOrg: args.nameOfOrg,
    nameOfUser: args.nameOfUser,
    orgId: args.orgId,
    payPalId: args.payPalId,
    userId: args.userId,
  });

  return createdDonation.toObject();
};
