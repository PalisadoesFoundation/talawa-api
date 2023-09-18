import "dotenv/config";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import { LENGTH_VALIDATION_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
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
    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    // Checks whether currentUser with _id === context.userId exists.
    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

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
    let validationResultLocation = {
      isLessThanMaxLength: false,
    };

    if (args.data?.name && args.data?.description && args.data?.location) {
      validationResultName = isValidString(args.data?.name, 256);
      validationResultDescription = isValidString(args.data?.description, 500);
      validationResultLocation = isValidString(args.data?.location, 50);
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
    if (!validationResultLocation.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }

    // Creates new organization.
    const createdOrganization = await Organization.create({
      ...args.data,
      image: uploadImageFileName ? uploadImageFileName : null,
      creator: context.userId,
      admins: [context.userId],
      members: [context.userId],
    });

    await cacheOrganizations([createdOrganization?.toObject()]);

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
