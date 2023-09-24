import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";

// @ts-ignore
export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_parent, args, _context) => {
    // Creates new Ad.
    const createdAd = await Advertisement.create({
      ...args,
    });
    // Returns createdAd.
    return createdAd.toObject();
  };
