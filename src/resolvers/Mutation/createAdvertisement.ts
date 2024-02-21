import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";
// @ts-ignore
export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  async (_parent, args, _context) => {
    //This code block is used to avoid un-necessary lint erros.
    console.log(_parent);
    console.log(_context);

    // Creates new Ad.
    const createdAd = await Advertisement.create({
      ...args,
      creatorId: _context.userId,
    });
    // Returns createdAd.
    return createdAd.toObject();
  };
