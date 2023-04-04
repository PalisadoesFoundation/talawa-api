import "dotenv/config";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import { LENGTH_VALIDATION_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
import { superAdminCheck } from "../../utilities";
import { isValidString } from "../../libraries/validators/validateString";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
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

    superAdminCheck(currentUser!);

    //Upload file
    let uploadImageFileName = null;
    if (args.input.organizationImage) {
      uploadImageFileName = await uploadEncodedImage(args.input.organizationImage!, null);
    }

    // Checks if the recieved arguments are valid according to standard input norms
    const validationResult_Name = isValidString(args.input.data!.name, 256);
    const validationResult_Description = isValidString(
      args.input.data!.description,
      500
    );
    const validationResult_Location = isValidString(
      args.input.data!.location!,
      50
    );

    if (!validationResult_Name.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }
    if (!validationResult_Description.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }
    if (!validationResult_Location.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }

    // Creates new organization.
    const createdOrganization = await Organization.create({
      ...args.input.data,
      image: uploadImageFileName ? uploadImageFileName : null,
      creator: context.userId,
      admins: [context.userId],
      members: [context.userId],
    });

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
