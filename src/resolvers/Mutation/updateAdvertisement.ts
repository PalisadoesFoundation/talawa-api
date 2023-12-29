import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";

export const updateAdvertisement: MutationResolvers["updateAdvertisement"] =
  async (_parent, args, _context) => {
    const currentUser = await User.findOne({
      _id: _context.userId,
    });

    if (currentUser === null) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const advertisement = await Advertisement.findOne({
      _id: args.input.id,
    }).lean();

    if (!advertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM
      );
    }

    return await Advertisement.findOneAndUpdate(
      {
        _id: args.input.id,
      },
      {
        ...(args.input as any),
      },
      {
        new: true,
      }
    ).lean();
  };
