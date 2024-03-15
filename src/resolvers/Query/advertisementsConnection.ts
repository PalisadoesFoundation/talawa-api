import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";

/**
 * This function returns list of Advertisement from the database.
 * @returns An object that contains a list of Ads.
 */
export const advertisementsConnection: QueryResolvers["advertisementsConnection"] =
  async (_parent, _args, context) => {
    const advertisements = await Advertisement.find().lean();
    const advertisementsWithMediaURLResolved = advertisements.map(
      (advertisement) => ({
        ...advertisement,
        mediaUrl: `${context.apiRootUrl}${advertisement.mediaUrl}`,
        organization: {
          _id: advertisement.organizationId,
        },
      }),
    );

    return advertisementsWithMediaURLResolved;
  };
