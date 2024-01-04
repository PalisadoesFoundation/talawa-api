import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  INPUT_NOT_FOUND_ERROR,
  END_DATE_VALIDATION_ERROR,
  START_DATE_VALIDATION_ERROR,
} from "../../constants";

export const updateAdvertisement: MutationResolvers["updateAdvertisement"] =
  async (_parent, args, _context) => {
    const { _id, ...otherFields } = args.input;

    //If there is no input
    if (Object.keys(otherFields).length === 0) {
      throw new errors.InputValidationError(
        requestContext.translate(INPUT_NOT_FOUND_ERROR.MESSAGE),
        INPUT_NOT_FOUND_ERROR.CODE,
        INPUT_NOT_FOUND_ERROR.PARAM
      );
    }

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
      _id: args.input._id,
    }).lean();

    if (!advertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM
      );
    }

    const { startDate, endDate } = args.input;

    //If startDate is less than current date
    if (
      startDate &&
      new Date(startDate) <= new Date(new Date().toDateString())
    ) {
      throw new errors.InputValidationError(
        requestContext.translate(START_DATE_VALIDATION_ERROR.MESSAGE),
        START_DATE_VALIDATION_ERROR.CODE,
        START_DATE_VALIDATION_ERROR.PARAM
      );
    }

    //If endDate is less than startDate
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new errors.InputValidationError(
        requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
        END_DATE_VALIDATION_ERROR.CODE,
        END_DATE_VALIDATION_ERROR.PARAM
      );
    }

    return await Advertisement.findOneAndUpdate(
      {
        _id: args.input._id,
      },
      {
        ...(args.input as any),
      },
      {
        new: true,
      }
    ).lean();
  };
