import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";

/**
 * This function enables to create a donation as transaction
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns Created Donation
 */
export const createDonation: MutationResolvers["createDonation"] = async (
  _parent,
  args,
  context
) => {
  const createdDonation = await Donation.create({
    amount: args.amount,
    nameOfOrg: args.nameOfOrg,
    nameOfUser: args.nameOfUser,
    orgId: args.orgId,
    payPalId: args.payPalId,
    userId: args.userId,
  });
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.CREATE,
    "Donation",
    `Donation:${createdDonation._id} created`
  );

  return createdDonation.toObject();
};
