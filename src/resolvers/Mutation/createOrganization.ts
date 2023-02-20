import "dotenv/config";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { uploadImage } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  LENGTH_VALIDATION_ERROR,
  REGEX_VALIDATION_ERROR,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { superAdminCheck } from "../../utilities/superAdminCheck";
import { isValidString } from "../../libraries/validators/validateString";

export const createOrganization: MutationResolvers["createOrganization"] =
  async (_parent, args, context) => {
    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    // Checks whether currentUser with _id === context.userId exists.
    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const currentUser = await User.findById({
      _id: context.userId,
    });
    superAdminCheck(currentUser!);
    //Upload file
    let uploadImageObj;
    if (args.file) {
      uploadImageObj = await uploadImage(args.file, null);
    }

    // Checks if the recieved arguments are valid according to standard input norms
    const validationResult_Name = isValidString(args.data!.name, 256);
    const validationResult_Description = isValidString(
      args.data!.description,
      500
    );
    const validationResult_Location = isValidString(args.data!.location!, 50);
    let tagsString = "";
    for (let i = 0; i < args.data!.tags.length; i++) {
      tagsString = tagsString + args.data!.tags[i];
    }
    const validationResult_Tags = isValidString(tagsString, 256);
    if (!validationResult_Name.isFollowingPattern) {
      throw new errors.InputValidationError(
        requestContext.translate(`${REGEX_VALIDATION_ERROR.message} in name`),
        REGEX_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Name.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.message} 256 characters in name`
        ),
        LENGTH_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Description.isFollowingPattern) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${REGEX_VALIDATION_ERROR.message} in description`
        ),
        REGEX_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Description.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.message} 500 characters in description`
        ),
        LENGTH_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Location.isFollowingPattern) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${REGEX_VALIDATION_ERROR.message} in location`
        ),
        REGEX_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Location.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.message} 50 characters in location`
        ),
        LENGTH_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Tags.isFollowingPattern) {
      throw new errors.InputValidationError(
        requestContext.translate(`${REGEX_VALIDATION_ERROR.message} in tags`),
        REGEX_VALIDATION_ERROR.code
      );
    }
    if (!validationResult_Tags.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.message} 256 characters in tags`
        ),
        LENGTH_VALIDATION_ERROR.code
      );
    }

    // Creates new organization.
    const createdOrganization = await Organization.create({
      ...args.data,
      image: uploadImageObj ? uploadImageObj.newImagePath : null,
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
