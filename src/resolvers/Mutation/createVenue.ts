import {
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  VENUE_ALREADY_EXISTS_ERROR,
  VENUE_NAME_MISSING_ERROR,
} from "../../constants";
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

/**
 * Creates a new venue within an organization, if the user has appropriate permissions and the venue does not already exist.
 *
 * This resolver performs the following checks:
 *
 * 1. Verifies the existence of the user and fetches their profile.
 * 2. Checks if the specified organization exists.
 * 3. Ensures the user is authorized to create a venue by verifying their admin or superadmin status within the organization.
 * 4. Validates that a venue name is provided.
 * 5. Ensures that no venue with the same name already exists within the organization.
 * 6. Uploads an image if provided and associates it with the venue.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including the venue details and organization ID.
 * @param context - The context object, including the user ID, API root URL, and other necessary context for authorization and image upload.
 *
 * @returns The created venue object, including the associated organization.
 *
 * @remarks This function includes validation for user authorization, venue uniqueness, and handles image uploads if applicable.
 */
export const createVenue: MutationResolvers["createVenue"] = async (
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

  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  });

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether the user is admin or superadmin.
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

  // Check if the venue name provided is an empty string.
  if (!args.data?.name ?? "") {
    throw new errors.InputValidationError(
      requestContext.translate(VENUE_NAME_MISSING_ERROR.MESSAGE),
      VENUE_NAME_MISSING_ERROR.CODE,
      VENUE_NAME_MISSING_ERROR.PARAM,
    );
  }

  // Check if a venue with the same organizationId and name exists.
  const existingVenue = await Venue.findOne({
    name: args.data.name,
    organization: args.data.organizationId,
  });

  if (existingVenue) {
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

  const newVenue = await Venue.create({
    ...args.data,
    organization: organization._id,
    imageUrl: uploadImageFileName
      ? `${context.apiRootUrl}${uploadImageFileName}`
      : null,
  });

  return {
    ...newVenue.toObject(),
    organization: organization.toObject(),
  };
};
