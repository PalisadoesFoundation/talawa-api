import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";

/**
 * This function enables to delete a donation record from the database.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns Boolean value denoting whether the deletion was successful or not.
 */
export const deleteDonationById: MutationResolvers["deleteDonationById"] =
  async (_parent, args) => {
    const deletedDonation = await Donation.deleteOne({
      _id: args.id,
    });

    return { success: deletedDonation.deletedCount ? true : false };
  };
