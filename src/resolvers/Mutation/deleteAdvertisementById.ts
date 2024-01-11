import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";

/**
 * This function enables to delete a donation record from the database.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns Boolean value denoting whether the deletion was successful or not.
 */
export const deleteAdvertisementById: MutationResolvers["deleteAdvertisementById"] =
  async (_parent: any, args: { id: any }, context) => {
    const deletedAdvertisement = await Advertisement.deleteOne({
      _id: args.id,
    });
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.DELETE,
      "Advertisement",
      `Advertisement:${args.id} deleted`
    );
    return { success: deletedAdvertisement.deletedCount ? true : false };
  };
