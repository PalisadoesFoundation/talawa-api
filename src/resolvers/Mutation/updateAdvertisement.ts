import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  INPUT_NOT_FOUND_ERROR,
  END_DATE_VALIDATION_ERROR,
  START_DATE_VALIDATION_ERROR,
  FIELD_NON_EMPTY_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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

    // Check for unintended null values in permitted fields, if all fields are permitted
    for (const field of Object.keys(args.input)) {
      const fieldValue = (args.input as Record<string, any>)[field];
      if (
        fieldValue === null ||
        (typeof fieldValue === "string" && fieldValue.trim() === "")
      ) {
        throw new errors.InputValidationError(
          requestContext.translate(FIELD_NON_EMPTY_ERROR.MESSAGE),
          FIELD_NON_EMPTY_ERROR.CODE,
          FIELD_NON_EMPTY_ERROR.PARAM
        );
      }
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

    if (currentUser.userType === "USER") {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    const { startDate, endDate } = args.input;

    //If startDate is less than or equal to current date
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

    //If endDate is less than or equal to startDate
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new errors.InputValidationError(
        requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
        END_DATE_VALIDATION_ERROR.CODE,
        END_DATE_VALIDATION_ERROR.PARAM
      );
    }

    const updatedAdvertisement = await Advertisement.findOneAndUpdate(
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

    if (!updatedAdvertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM
      );
    }

    const updatedAdvertisementPayload = {
      _id: updatedAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
      name: updatedAdvertisement.name,
      orgId: updatedAdvertisement.orgId.toString(),
      link: updatedAdvertisement.link,
      type: updatedAdvertisement.type,
      startDate: updatedAdvertisement.startDate,
      endDate: updatedAdvertisement.endDate,
      createdAt: updatedAdvertisement.createdAt,
      updatedAt: updatedAdvertisement.updatedAt,
    };
    return {
      advertisement: updatedAdvertisementPayload,
    };
  };
