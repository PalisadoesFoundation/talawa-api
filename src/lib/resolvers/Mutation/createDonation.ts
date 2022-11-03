import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";

/**
 * @name createDonation creates a Donation as transaction and returns the same
 * @description creates a document of Donation type and stores it in database
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
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
