import { Types } from "mongoose";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  END_DATE_VALIDATION_ERROR,
  FIELD_NON_EMPTY_ERROR,
  INPUT_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Advertisement, AppUserProfile, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";

export const updateAdvertisement: MutationResolvers["updateAdvertisement"] =
  async (_parent, args, context) => {
    const { _id, ...otherFields } = args.input;

    //If there is no input
    if (Object.keys(otherFields).length === 0) {
      throw new errors.InputValidationError(
        requestContext.translate(INPUT_NOT_FOUND_ERROR.MESSAGE),
        INPUT_NOT_FOUND_ERROR.CODE,
        INPUT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check for unintended null values in permitted fields, if all fields are permitted
    for (const fieldValue of Object.values(args.input)) {
      if (
        fieldValue === null ||
        (typeof fieldValue === "string" && fieldValue.trim() === "")
      ) {
        throw new errors.InputValidationError(
          requestContext.translate(FIELD_NON_EMPTY_ERROR.MESSAGE),
          FIELD_NON_EMPTY_ERROR.CODE,
          FIELD_NON_EMPTY_ERROR.PARAM,
        );
      }
    }

    const currentUser = await User.findOne({
      _id: context.userId,
    });

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    const advertisement = await Advertisement.findOne({
      _id: _id,
    });
    if (!advertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const userIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
      (organisation) =>
        organisation === advertisement.organizationId ||
        new Types.ObjectId(organisation?.toString()).equals(
          advertisement.organizationId,
        ),
    );
    if (!userIsOrganizationAdmin && !currentUserAppProfile.isSuperAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
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
        START_DATE_VALIDATION_ERROR.PARAM,
      );
    }

    //If endDate is less than or equal to startDate
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      throw new errors.InputValidationError(
        requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
        END_DATE_VALIDATION_ERROR.CODE,
        END_DATE_VALIDATION_ERROR.PARAM,
      );
    }

    let uploadMediaFile = null;

    if (args.input.mediaFile) {
      const dataUrlPrefix = "data:";
      if (args.input.mediaFile.startsWith(dataUrlPrefix + "image/")) {
        uploadMediaFile = await uploadEncodedImage(args.input.mediaFile, null);
      } else if (args.input.mediaFile.startsWith(dataUrlPrefix + "video/")) {
        uploadMediaFile = await uploadEncodedVideo(args.input.mediaFile, null);
      } else {
        throw new Error("Unsupported file type.");
      }
    }

    const updatedAdvertisement = await Advertisement.findOneAndUpdate(
      {
        _id: _id,
      },
      {
        $set: {
          ...args.input,
          mediaUrl: uploadMediaFile,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (!updatedAdvertisement) {
      throw new errors.NotFoundError(
        requestContext.translate(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE),
        ADVERTISEMENT_NOT_FOUND_ERROR.CODE,
        ADVERTISEMENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    const updatedAdvertisementPayload = {
      _id: updatedAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
      name: updatedAdvertisement.name,
      organizationId: updatedAdvertisement.organizationId,
      mediaUrl: updatedAdvertisement.mediaUrl,
      type: updatedAdvertisement.type,
      startDate: updatedAdvertisement.startDate,
      endDate: updatedAdvertisement.endDate,
      createdAt: updatedAdvertisement.createdAt,
      updatedAt: updatedAdvertisement.updatedAt,
      creatorId: updatedAdvertisement.creatorId,
    };
    return {
      advertisement: { ...updatedAdvertisementPayload },
    };
  };
