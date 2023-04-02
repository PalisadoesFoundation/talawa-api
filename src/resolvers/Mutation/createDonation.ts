import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";

/**
 * This function enables to create a donation as transaction
 * @param _parent - parent of current request
 * @param args- payload provided with the request
 * @param context - context of entire application
 * @returns Created Donation
 */
export const createDonation: MutationResolvers["createDonation"] = async (
  _parent,
  args
) => {
  const createdDonation = await Donation.create({
    amount: args.input.amount,
    nameOfOrg: args.input.nameOfOrg,
    nameOfUser: args.input.nameOfUser,
    orgId: args.input.orgId,
    payPalId: args.input.payPalId,
    userId: args.input.userId,
  });

  return createdDonation.toObject();
};
