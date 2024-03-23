import "dotenv/config";
import {
  LENGTH_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import {
  ActionItemCategory,
  AppUserProfile,
  Organization,
  User,
} from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import type {
  Address,
  MutationResolvers,
} from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
/**
 * This function enables to create an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the user has appUserProfile
 * @returns Created organization
 */
export const createOrganization: MutationResolvers["createOrganization"] =
  async (_parent, args, context) => {
    const currentUser = await User.findById({
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
    superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

    //Upload file
    let uploadImageFileName = null;
    if (args.file) {
      uploadImageFileName = await uploadEncodedImage(args.file, null);
    }

    // Checks if the recieved arguments are valid according to standard input norms
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

    // Creates new organization.
    const createdOrganization = await Organization.create({
      ...args.data,
      address: args.data?.address,
      image: uploadImageFileName ? uploadImageFileName : null,
      creatorId: context.userId,
      admins: [context.userId],
      members: [context.userId],
    });

    // Creating a default actionItemCategory
    await ActionItemCategory.create({
      name: "Default",
      organizationId: createdOrganization._id,
      creatorId: context.userId,
    });

    await cacheOrganizations([createdOrganization.toObject()]);

    /*
    Adds createdOrganization._id to joinedOrganizations, createdOrganizations
    and adminFor lists on currentUser's document with _id === context.userId
    */

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

    // Returns createdOrganization.
    return createdOrganization.toObject();
  };
/**
 * Validates an address object to ensure its fields meet specified criteria.
 * @param address - The address object to validate
 * @returns An object containing the validation result: isAddressValid (true if the address is valid, false otherwise)
 */
function validateAddress(address: Address | undefined): {
  isAddressValid: boolean;
} {
  if (!address) {
    return { isAddressValid: false };
  }

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
