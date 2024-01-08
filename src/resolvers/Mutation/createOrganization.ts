import "dotenv/config";
import type { MutationResolvers , Address } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import { LENGTH_VALIDATION_ERROR } from "../../constants";
import { superAdminCheck } from "../../utilities";
import { isValidString } from "../../libraries/validators/validateString";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
/**
 * This function enables to create an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * @returns Created organization
 */
export const createOrganization: MutationResolvers["createOrganization"] =
  async (_parent, args, context) => {
    const currentUser = await User.findById({
      _id: context.userId,
    });

    if (currentUser) {
      superAdminCheck(currentUser);
    }

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

    if (args.data?.name && args.data?.description && args.data?.address) {
      validationResultName = isValidString(args.data?.name, 256);
      validationResultDescription = isValidString(args.data?.description, 500);
      validationResultAddress = validateAddress(args.data?.address);
    }

    if (!validationResultName.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }
    if (!validationResultDescription.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`
        ),
        LENGTH_VALIDATION_ERROR.CODE
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
      creator: context.userId,
      admins: [context.userId],
      members: [context.userId],
    });

    await cacheOrganizations([createdOrganization.toObject()!]);

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
          createdOrganizations: createdOrganization._id,
          adminFor: createdOrganization._id,
        },
      }
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

  const isCityValid = !!city && city.length > 0;

  // It should be a valid country code.
  const isCountryCodeValid = !!countryCode && countryCode.length === 2; // Assuming country code is a 2-letter string

  // It should exist and have a length greater than 0
  const isDependentLocalityValid =
    !!dependentLocality && dependentLocality.length > 0;

  // Line 1 should exist and have a length greater than 0
  const isLine1Valid = !!line1 && line1.length > 0;

  // Line 2 should exist and have a length greater than 0
  const isLine2Valid = !!line2 && line2.length > 0;

  // It should exist and have a valid format.
  const isPostalCodeValid = !!postalCode && /^\d+$/.test(postalCode);

  // It should exist and have a valid format based on your criteria
  const isSortingCodeValid = !!sortingCode && sortingCode.length > 0; // Assuming a specific format or requirement

  // It should exist and have a length greater than 0
  const isStateValid = !!state && state.length > 0;

  const isAddressValid =
    isCityValid &&
    isCountryCodeValid &&
    isDependentLocalityValid &&
    isLine1Valid &&
    isLine2Valid &&
    isPostalCodeValid &&
    isSortingCodeValid &&
    isStateValid;

  return { isAddressValid };
}
