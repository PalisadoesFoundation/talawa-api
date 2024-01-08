import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";

/**
 * This function returns list of Advertisement from the database.
 * @returns An object that contains a list of Ads.
 */
export const getAdvertisements: QueryResolvers["getAdvertisements"] = async (
  _parent,
  args,
  context
) => {
  const advertisements = await Advertisement.find().lean();
  const advertisementsWithMediaURLResolved = advertisements.map(
    (advertisement) => ({
      ...advertisement,
      mediaUrl: advertisement.mediaUrl
        ? `${context.apiRootUrl}${advertisement.mediaUrl}`
        : null,
    })
  );

  return advertisementsWithMediaURLResolved;
};
