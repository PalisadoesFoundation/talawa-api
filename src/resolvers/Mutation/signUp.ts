import bcrypt from "bcryptjs";
import {
  EMAIL_ALREADY_EXISTS_ERROR,
  LAST_RESORT_SUPERADMIN_EMAIL,
  //LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  AppUserProfile,
  User,
  Organization,
  MembershipRequest,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  copyToClipboard,
  createAccessToken,
  createRefreshToken,
} from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { Document } from "mongoose";
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

  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.selectedOrgainzation,
  ]);

  organization = organizationFoundInCache[0];
  if (organizationFoundInCache[0] == null) {
    organization = await Organization.findOne({
      _id: args.data.selectedOrgainzation,
    }).lean();

    if (organization != null) {
      await cacheOrganizations([organization]);
    }
  }

  const isLastResortSuperAdmin =
    args.data.email === LAST_RESORT_SUPERADMIN_EMAIL;
  const hashedPassword = await bcrypt.hash(args.data.password, 12);

  // Upload file
  let uploadImageFileName;
  if (args.file) {
    uploadImageFileName = await uploadEncodedImage(args.file, null);
  }
  let createdUser:
    | (InterfaceUser & Document<unknown, unknown, InterfaceUser>)
    | null;
  let appUserProfile:
    | (InterfaceAppUserProfile &
        Document<unknown, unknown, InterfaceAppUserProfile>)
    | null;

  if (organization !== null) {
    await cacheOrganizations([organization]);
    // If organization requested by user is a public organization, then no need of creating a membership request

    if (organization.userRegistrationRequired == false) {
      createdUser = await User.create({
        ...args.data,
        email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
        image: uploadImageFileName ? uploadImageFileName : null,
        password: hashedPassword,
        userType: isLastResortSuperAdmin ? "SUPERADMIN" : "USER",
        joinedOrganizations: [args.data.selectedOrgainzation],
      });

      appUserProfile = await AppUserProfile.create({
        userId: createdUser._id,
        appLanguageCode: args.data.appLanguageCode || "en",
        isSuperAdmin: isLastResortSuperAdmin,
        adminApproved: true,
      });
      // Update the organization
      await Organization.findOneAndUpdate(
        {
          _id: organization._id,
        },
        {
          $push: {
            members: createdUser._id,
          },
        },
        {
          new: true,
        },
      );
    } else {
      createdUser = await User.create({
        ...args.data,
        email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
        image: uploadImageFileName ? uploadImageFileName : null,
        password: hashedPassword,
        userType: isLastResortSuperAdmin ? "SUPERADMIN" : "USER",
      });

      appUserProfile = await AppUserProfile.create({
        userId: createdUser._id,
        appLanguageCode: args.data.appLanguageCode || "en",
        isSuperAdmin: isLastResortSuperAdmin,
        adminApproved: isLastResortSuperAdmin ? true : false,
      });
      // A membership request will be made to the organization
      const createdMembershipRequest = await MembershipRequest.create({
        user: createdUser._id,
        organization: organization._id,
      });

      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: organization._id,
        },
        {
          $push: {
            membershipRequests: createdMembershipRequest._id,
          },
        },
        {
          new: true,
          projection: { password: 0 },
        },
      ).lean();

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      createdUser = await User.findOneAndUpdate(
        {
          _id: createdUser._id,
        },
        {
          $push: {
            membershipRequests: createdMembershipRequest._id,
          },
        },
        {
          new: true,
          projection: { password: 0 },
        },
      );
    }
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }
  const updatedUser = await User.findOneAndUpdate(
    {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      _id: createdUser!._id,
    },
    {
      appUserProfileId: appUserProfile._id,
    },
    {
      new: true,
      projection: { password: 0 },
    },
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const accessToken = await createAccessToken(createdUser!, appUserProfile);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const refreshToken = await createRefreshToken(createdUser!, appUserProfile);

  copyToClipboard(`{
  "Authorization": "Bearer ${accessToken}"
}`);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const filteredCreatedUser = updatedUser!.toObject();
  appUserProfile = await AppUserProfile.findOne({
    userId: updatedUser?._id.toString(),
  })
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("eventAdmin")
    .populate("adminFor");

  return {
    user: filteredCreatedUser,
    selectedOrganization: args.data.selectedOrgainzation,
    appUserProfile: appUserProfile as InterfaceAppUserProfile,
    accessToken,
    refreshToken,
  };
};
