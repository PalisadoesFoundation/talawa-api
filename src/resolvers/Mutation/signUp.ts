import bcrypt from "bcryptjs";
import type { Document } from "mongoose";
import {
  EMAIL_ALREADY_EXISTS_ERROR,
  LAST_RESORT_SUPERADMIN_EMAIL,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  AppUserProfile,
  MembershipRequest,
  Organization,
  User,
} from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import {
  copyToClipboard,
  createAccessToken,
  createRefreshToken,
} from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
//import { isValidString } from "../../libraries/validators/validateString";
//import { validatePassword } from "../../libraries/validators/validatePassword";
/**
 * This function enables sign up.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @returns Sign up details.
 */
export const signUp: MutationResolvers["signUp"] = async (_parent, args) => {
  const userWithEmailExists = await User.exists({
    email: args.data.email.toLowerCase(),
  });

  if (userWithEmailExists) {
    throw new errors.ConflictError(
      requestContext.translate(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE),
      EMAIL_ALREADY_EXISTS_ERROR.CODE,
      EMAIL_ALREADY_EXISTS_ERROR.PARAM,
    );
  }

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.selectedOrganization,
  ]);
  let organization = organizationFoundInCache[0];
  if (organization === null) {
    organization = await Organization.findOne({
      _id: args.data.selectedOrganization,
    }).lean();
  }
  if (organization != null) {
    await cacheOrganizations([organization]);
  }
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      ),
    );
  }

  const hashedPassword = await bcrypt.hash(args.data.password, 12);

  // Upload file
  let uploadImageFileName = null;
  if (args.file) {
    uploadImageFileName = await uploadEncodedImage(args.file, null);
  }

  const isLastResortSuperAdmin =
    args.data.email.toLowerCase() ===
    LAST_RESORT_SUPERADMIN_EMAIL?.toLowerCase();

  let createdUser:
    | (InterfaceUser & Document<unknown, unknown, InterfaceUser>)
    | null;
  let appUserProfile:
    | (InterfaceAppUserProfile &
        Document<unknown, unknown, InterfaceAppUserProfile>)
    | null;

  //checking if the userRegistration is required by the organization
  if (organization.userRegistrationRequired === false) {
    //if it is not then user directly joined the organization
    createdUser = await User.create({
      ...args.data,
      email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
      image: uploadImageFileName,
      password: hashedPassword,
      joinedOrganizations: [organization._id],
    });

    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          members: createdUser._id,
        },
      },
    );
  } else {
    //if required then the membership request to the organization would be send.
    createdUser = await User.create({
      ...args.data,
      email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
      image: uploadImageFileName,
      password: hashedPassword,
    });

    //create a membershipRequest object
    const memberRequest = await MembershipRequest.create({
      user: createdUser._id,
      organization: organization._id,
    });

    //send the membership request to the organization
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          membershipRequests: memberRequest._id,
        },
      },
    );
  }
  appUserProfile = await AppUserProfile.create({
    userId: createdUser._id,
    appLanguageCode: args.data.appLanguageCode || "en",
    isSuperAdmin: isLastResortSuperAdmin,
  });
  const accessToken = await createAccessToken(createdUser, appUserProfile);
  const refreshToken = await createRefreshToken(createdUser, appUserProfile);

  copyToClipboard(`{
    "Authorization": "Bearer ${accessToken}"
  }`);
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: createdUser._id,
    },
    {
      appUserProfileId: appUserProfile._id,
    },
    {
      new: true,
    },
  )
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("membershipRequests")
    .populate("organizationsBlockedBy");

  if (updatedUser) {
    createdUser = updatedUser;
  }

  const filteredCreatedUser = updatedUser?.toObject();
  appUserProfile = await AppUserProfile.findOne({
    userId: updatedUser?._id.toString(),
  })
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .lean();

  delete filteredCreatedUser?.password;

  return {
    user: filteredCreatedUser as InterfaceUser,
    appUserProfile: appUserProfile as InterfaceAppUserProfile,
    accessToken,
    refreshToken,
  };
};
