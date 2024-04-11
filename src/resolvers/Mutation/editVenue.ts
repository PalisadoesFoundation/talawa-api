import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { Venue } from "../../models/Venue";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import {
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  VENUE_ALREADY_EXISTS_ERROR,
  VENUE_NAME_MISSING_ERROR,
  VENUE_NOT_FOUND_ERROR,
} from "./../../constants";
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
  context,
) => {
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
  if (!currentUserAppProfile) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const venue = await Venue.findById({
    _id: args.data.id,
  });

  if (!venue) {
    throw new errors.NotFoundError(
      requestContext.translate(VENUE_NOT_FOUND_ERROR.MESSAGE),
      VENUE_NOT_FOUND_ERROR.CODE,
      VENUE_NOT_FOUND_ERROR.PARAM,
    );
  }

  const organization = await Organization.findById({
    _id: venue.organization,
  });

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks Whether the user is admin or superadmin or not
  if (
    !(
      organization.admins?.some((admin) => admin._id.equals(context.userId)) ||
      currentUserAppProfile?.isSuperAdmin
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(ORGANIZATION_NOT_AUTHORIZED_ERROR.MESSAGE),
      ORGANIZATION_NOT_AUTHORIZED_ERROR.CODE,
      ORGANIZATION_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Check if the venue name provided is empty string
  if (args.data?.name === "") {
    throw new errors.InputValidationError(
      requestContext.translate(VENUE_NAME_MISSING_ERROR.MESSAGE),
      VENUE_NAME_MISSING_ERROR.CODE,
      VENUE_NAME_MISSING_ERROR.PARAM,
    );
  }

  // Check if a venue with the same organizationId and name exists
  const venuesWithOrganization = await Venue.find({
    organization: organization._id,
  });

  if (
    args.data?.name &&
    venuesWithOrganization.some((venue) => venue.name === args.data.name)
  ) {
    throw new errors.ConflictError(
      requestContext.translate(VENUE_ALREADY_EXISTS_ERROR.MESSAGE),
      VENUE_ALREADY_EXISTS_ERROR.CODE,
      VENUE_ALREADY_EXISTS_ERROR.PARAM,
    );
  }

  let uploadImageFileName = null;

  if (args.data?.file) {
    const dataUrlPrefix = "data:";
    if (args.data.file.startsWith(dataUrlPrefix + "image/")) {
      uploadImageFileName = await uploadEncodedImage(args.data.file, null);
    }
  }

  // update venue
  venue.name = args.data?.name || venue.name;
  venue.capacity = args.data?.capacity || venue.capacity;
  venue.description = args.data?.description || venue.description;
  venue.imageUrl = uploadImageFileName
    ? `${context.apiRootUrl}${uploadImageFileName}`
    : venue.imageUrl;

  await venue.save();

  return {
    ...venue.toObject(),
    organization: organization.toObject(),
  };
};
