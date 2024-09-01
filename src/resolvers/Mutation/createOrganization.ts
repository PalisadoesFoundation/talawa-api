import "dotenv/config";
import {
  LENGTH_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  ActionItemCategory,
  AppUserProfile,
  Organization,
  User,
} from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type {
  Address,
  MutationResolvers,
} from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";

/**
 * Creates a new organization.
 *
 * This resolver performs the following steps:
 *
 * 1. Verifies the existence of the current user making the request.
 * 2. Checks the user's app profile to ensure they are authenticated and authorized as a super admin.
 * 3. Validates the provided input data, including organization name, description, and address.
 * 4. Uploads an optional image file associated with the organization.
 * 5. Creates a new organization with the provided data and image.
 * 6. Creates a default action item category for the new organization.
 * 7. Updates the current user's document to include the new organization in their `joinedOrganizations`, `createdOrganizations`, and `adminFor` lists.
 * 8. Caches the newly created organization.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `name`: The name of the organization.
 *     - `description`: A description of the organization.
 *     - `address`: An optional address object for the organization.
 *   - `file`: An optional encoded image file for the organization.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns The created organization object.
 *
 * @remarks This function creates an organization, uploads an optional image, validates the input data, creates a default action item category, updates user records, and manages caching.
 */
export const createOrganization: MutationResolvers["createOrganization"] =
  async (_parent, args, context) => {
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

    if (!currentUser) {
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
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

    // Upload file
    let uploadImageFileName = null;
    if (args.file) {
      uploadImageFileName = await uploadEncodedImage(args.file, null);
    }

    // Validate input arguments
    let validationResultName = {
      isLessThanMaxLength: false,
    };
    let validationResultDescription = {
      isLessThanMaxLength: false,
    };
    let validationResultAddress = {
      isAddressValid: false,
    };

    if (args.data?.name && args.data?.description) {
      validationResultName = isValidString(args.data?.name, 256);
      validationResultDescription = isValidString(args.data?.description, 500);
    }

    if (args.data?.address) {
      validationResultAddress = validateAddress(args.data?.address);
    }

    if (!validationResultName.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`,
        ),
        LENGTH_VALIDATION_ERROR.CODE,
      );
    }
    if (!validationResultDescription.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`,
        ),
        LENGTH_VALIDATION_ERROR.CODE,
      );
    }
    if (!validationResultAddress.isAddressValid) {
      throw new errors.InputValidationError("Not a Valid Address");
    }

    // Create new organization
    const createdOrganization = await Organization.create({
      ...args.data,
      address: args.data?.address,
      image: uploadImageFileName ? uploadImageFileName : null,
      creatorId: context.userId,
      admins: [context.userId],
      members: [context.userId],
    });

    // Create default action item category
    await ActionItemCategory.create({
      name: "Default",
      organizationId: createdOrganization._id,
      creatorId: context.userId,
    });

    await cacheOrganizations([createdOrganization.toObject()]);

    // Update currentUser's document
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $push: {
          joinedOrganizations: createdOrganization._id,
        },
      },
    );
    await AppUserProfile.updateOne(
      {
        _id: currentUserAppProfile._id,
      },
      {
        $push: {
          createdOrganizations: createdOrganization._id,
          adminFor: createdOrganization._id,
        },
      },
    );

    // Return created organization
    return createdOrganization.toObject();
  };

/**
 * Validates an address object to ensure its fields meet specified criteria.
 * @param address - The address object to validate
 * @returns An object containing the validation result: isAddressValid (true if the address is valid, false otherwise)
 */
function validateAddress(address: Address): {
  isAddressValid: boolean;
} {
  const {
    city,
    countryCode,
    dependentLocality,
    line1,
    line2,
    postalCode,
    sortingCode,
    state,
  } = address;

  // Mandatory: It should be a valid country code.
  const isCountryCodeValid = !!countryCode && countryCode.length >= 2;

  // Mandatory: It should exist and have a length greater than 0
  const isCityValid = !!city && city.length > 0;

  // Optional: It should exist and have a length greater than 0
  const isDependentLocalityValid =
    dependentLocality === undefined ||
    (typeof dependentLocality === "string" && dependentLocality.length >= 0);

  // Optional: Line 1 should exist and have a length greater than 0
  const isLine1Valid =
    line1 === undefined || (typeof line1 === "string" && line1.length >= 0);

  // Optional: Line 2 should exist and have a length greater than 0, if provided
  const isLine2Valid =
    line2 === undefined || (typeof line2 === "string" && line2.length >= 0);

  // Optional: It should exist and have a valid format.
  const isPostalCodeValid =
    postalCode === undefined ||
    (typeof postalCode === "string" && /^\d*$/.test(postalCode));

  // Optional: It should exist and have a length greater than 0, if provided
  const isSortingCodeValid =
    sortingCode === undefined ||
    (typeof sortingCode === "string" && sortingCode.length >= 0);

  // Optional: It should exist and have a length greater than 0, if provided
  const isStateValid =
    state === undefined || (typeof state === "string" && state.length >= 0);

  const isAddressValid =
    isCityValid &&
    isCountryCodeValid &&
    isDependentLocalityValid &&
    isLine1Valid &&
    isLine2Valid &&
    isPostalCodeValid &&
    isSortingCodeValid &&
    isStateValid;

  return { isAddressValid: isAddressValid };
}
