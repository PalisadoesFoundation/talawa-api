import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Advertisement } from "../../models";
import { ADVERTISEMENT_NOT_FOUND_ERROR } from "../../constants";
import mongoose from "mongoose";

// @ts-expect-error : This block intentionally ignores TypeScript checking for incomplete code.
export const removeAdvertisement: MutationResolvers["removeAdvertisement"] =
  async (_parent, args, _context) => {
    //This code block is used to remove un-neceassary lint errors. it does not affect any functionality.
    console.log(_parent);
    console.log(_context);

    const myId = args.id ? args.id : "";

    if (mongoose.Types.ObjectId.isValid(myId)) {
      const currentAd = await Advertisement.findOne({
        _id: myId,
      }).lean();
      if (!currentAd) {
        throw new errors.NotFoundError(
          requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
          ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
          ADVERTISEMENT_NOT_FOUND_ERROR.PARAM,
        );
      }

      // Deletes the ad.
      await Advertisement.deleteOne({
        _id: myId,
      });
      // Returns deleted ad.
      return currentAd;
    }
  };
