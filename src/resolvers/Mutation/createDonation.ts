import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";

/**
 * Creates a new donation transaction.
 *
 * This function performs the following actions:
 * 1. Creates a new donation record in the database with the specified details.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `amount`: The amount of the donation.
 *   - `nameOfOrg`: The name of the organization receiving the donation.
 *   - `nameOfUser`: The name of the user making the donation.
 *   - `orgId`: The ID of the organization receiving the donation.
 *   - `payPalId`: The PayPal ID associated with the transaction.
 *   - `userId`: The ID of the user making the donation.
 * @param context - The context for the mutation, which is not used in this resolver.
 *
 * @returns The created donation record.
 *
 */
export const createDonation: MutationResolvers["createDonation"] = async (
  _parent,
  args,
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
