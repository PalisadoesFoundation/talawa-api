import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";
import { storeTransaction } from "../../utilities/storeTransaction";
import { TRANSACTION_LOG_TYPES } from "../../constants";
// @ts-ignore
export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_parent, args, _context) => {
    // Creates new Ad.
    const createdAd = await Advertisement.create({
      ...args,
    });
    await storeTransaction(
      _context.userId,
      TRANSACTION_LOG_TYPES.CREATE,
      "Advertisement",
      `Advertisement:${createdAd._id} created`
    );
    // Returns createdAd.
    return createdAd.toObject();
  };
