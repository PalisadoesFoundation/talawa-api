import bcrypt from "bcryptjs";
import {
  LAST_RESORT_SUPERADMIN_EMAIL,
  //LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  EMAIL_ALREADY_EXISTS_ERROR,
  //REGEX_VALIDATION_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { User, Organization, MembershipRequest } from "../../models";
import {
  createAccessToken,
  createRefreshToken,
  copyToClipboard,
} from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { Document } from "mongoose";
import { omit } from "lodash";
import { encryptEmail } from "../../utilities/encryptionModule";
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

  if (userWithEmailExists === true) {
    throw new errors.ConflictError(
      requestContext.translate(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE),
      EMAIL_ALREADY_EXISTS_ERROR.CODE,
      EMAIL_ALREADY_EXISTS_ERROR.PARAM
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
  }

  const isLastResortSuperAdmin =
    args.data.email === LAST_RESORT_SUPERADMIN_EMAIL;
  const hashedPassword = await bcrypt.hash(args.data.password, 12);
  const encryptedEmail = encryptEmail(args.data.email);
  // Upload file
  let uploadImageFileName;
  if (args.file) {
    uploadImageFileName = await uploadEncodedImage(args.file, null);
  }
  // eslint-disable-next-line
  let createdUser: (InterfaceUser & Document<any, any, InterfaceUser>) | null;

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
        adminApproved: true,
        joinedOrganizations: [args.data.selectedOrgainzation],
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
        }
      );
    } else {
      createdUser = await User.create({
        ...args.data,
        email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
        image: uploadImageFileName ? uploadImageFileName : null,
        password: hashedPassword,
        userType: isLastResortSuperAdmin ? "SUPERADMIN" : "USER",
        adminApproved: isLastResortSuperAdmin,
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
        }
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
        }
      );
    }
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }
  // eslint-disable-next-line
  const accessToken = await createAccessToken(createdUser!);
  // eslint-disable-next-line
  const refreshToken = await createRefreshToken(createdUser!);

  copyToClipboard(`{
  "Authorization": "Bearer ${accessToken}"
}`);
  // eslint-disable-next-line
  const filteredCreatedUser = createdUser!.toObject();

  const userToBeReturned = omit(filteredCreatedUser, "password");

  return {
    user: userToBeReturned,
    selectedOrganization: args.data.selectedOrgainzation,
    accessToken,
    refreshToken,
  };
};
