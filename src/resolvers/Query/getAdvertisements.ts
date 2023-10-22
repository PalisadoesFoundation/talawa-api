import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";

/**
 * This function returns list of Advertisement from the database.
 * @returns An object that contains a list of Ads.
 */
export const getAdvertisements: QueryResolvers["getAdvertisements"] =
  async () => {
    return await Advertisement.find().lean();
  };
