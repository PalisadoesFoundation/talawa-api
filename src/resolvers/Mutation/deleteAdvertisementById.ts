import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";

/**
 * This function enables to delete a donation record from the database.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns Boolean value denoting whether the deletion was successful or not.
 */
export const deleteAdvertisementById: MutationResolvers["deleteAdvertisementById"] =
  async (_parent: any, args: { id: any }) => {
    const deletedAdvertisement = await Advertisement.deleteOne({
      _id: args.id,
    });

    return { success: deletedAdvertisement.deletedCount ? true : false };
  };
