import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";

/**
 * This function enables to delete a donation record from the database.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns Boolean value denoting whether the deletion was successful or not.
 */
export const deleteDonationById: MutationResolvers["deleteDonationById"] =
  async (_parent, args, context) => {
    const deletedDonation = await Donation.deleteOne({
      _id: args.id,
    });
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.DELETE,
      "Donation",
      `Donation:${args.id} deleted`
    );

    return { success: deletedDonation.deletedCount ? true : false };
  };
