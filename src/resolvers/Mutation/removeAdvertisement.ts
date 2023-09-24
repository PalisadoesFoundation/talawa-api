import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Advertisement } from "../../models";
import { ADVERTISEMENT_NOT_FOUND_ERROR } from "../../constants";
import { ObjectId } from "mongoose";

// @ts-ignore
export const removeAdvertisement: MutationResolvers["removeAdvertisement"] =
  async (_parent, args, context) => {
    const currentAd = await Advertisement.findOne({
      _id: context.id ? context.id : "",
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
      _id: context.id ? context.id : "",
    });
    // Returns deleted ad.
    return currentAd;
  };
