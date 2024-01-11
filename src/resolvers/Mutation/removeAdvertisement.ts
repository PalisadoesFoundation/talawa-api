import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Advertisement } from "../../models";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { storeTransaction } from "../../utilities/storeTransaction";

// @ts-ignore
export const removeAdvertisement: MutationResolvers["removeAdvertisement"] =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_parent, args, _context) => {
    const currentAd = await Advertisement.findOne({
      _id: args.id ? args.id : "",
    }).lean();

    if (!currentAd) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM
      );
    }

    // Deletes the ad.
    await Advertisement.deleteOne({
      _id: args.id ? args.id : "",
    });
    await storeTransaction(
      _context.userId,
      TRANSACTION_LOG_TYPES.DELETE,
      "Advertisement",
      `Advertisement:${args.id} deleted`
    );
    // Returns deleted ad.
    return currentAd;
  };
