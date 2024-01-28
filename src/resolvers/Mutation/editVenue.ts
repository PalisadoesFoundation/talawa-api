import {
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  VENUE_ALREADY_EXISTS_ERROR,
  VENUE_NAME_MISSING_ERROR,
  VENUE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "./../../constants";
import { Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Venue } from "../../models/Venue";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
/**
 * This function enables to edit a venue.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * 3. If the venue exists
 * 4. If the user is authorized
 * 5. If the venue details are valid
 * 5. If the venue already exists
 * @returns Updated venue
 */

export const editVenue: MutationResolvers["editVenue"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const venue = await Venue.findOne({
    _id: args.data?._id,
  }).lean();

  const organization = await Organization.findOne({
    _id: args.data?.organizationId,
  })
    .populate("venues")
    .lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  if (!venue) {
    throw new errors.NotFoundError(
      requestContext.translate(VENUE_NOT_FOUND_ERROR.MESSAGE),
      VENUE_NOT_FOUND_ERROR.CODE,
      VENUE_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks Whether the user is admin or superadmin or not
  if (
    !(
      organization.admins?.some((admin) => admin._id.equals(context.userId)) ||
      currentUser.userType == "SUPERADMIN"
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE),
      ORGANIZATION_NOT_AUTHORIZED_ERROR.CODE,
      ORGANIZATION_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  if (!args.data?.name ?? "") {
    // Check if the venue name provided is null, undefined or empty string
    throw new errors.InputValidationError(
      requestContext.translate(VENUE_NAME_MISSING_ERROR.MESSAGE),
      VENUE_NAME_MISSING_ERROR.CODE,
      VENUE_NAME_MISSING_ERROR.PARAM
    );
  }

  // Check if a venue with the same place already exists in the organization
  if (organization.venues?.some((venue) => venue.name === args.data?.name)) {
    throw new errors.ConflictError(
      requestContext.translate(VENUE_ALREADY_EXISTS_ERROR.MESSAGE),
      VENUE_ALREADY_EXISTS_ERROR.CODE,
      VENUE_ALREADY_EXISTS_ERROR.PARAM
    );
  }

  let uploadImageFileName = null;

  if (args.file) {
    const dataUrlPrefix = "data:";
    if (args.file.startsWith(dataUrlPrefix + "image/")) {
      uploadImageFileName = await uploadEncodedImage(args.file, null);
    }
  }

  // Find the venue by its _id and update its place and capacity
  const updatedVenue = await Venue.findOneAndUpdate(
    { _id: venue?._id },
    {
      $set: {
        name: args.data?.name,
        capacity: args.data?.capacity,
        description: args.data?.description,
        imageUrl: uploadImageFileName
          ? `${context.apiRootUrl}${uploadImageFileName}`
          : null,
      },
    },
    { new: true }
  );

  return updatedVenue!;
};
