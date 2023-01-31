import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";

/**
 * @name deleteDonationById
 * @description  delets a Donation record from the database and returns it if successful.
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 */
export const deleteDonationById: MutationResolvers["deleteDonationById"] =
  async (_parent, args) => {
    const deletedDonation = await Donation.deleteOne({
      _id: args.id,
    });

    return { success: deletedDonation.deletedCount ? true : false };
  };
