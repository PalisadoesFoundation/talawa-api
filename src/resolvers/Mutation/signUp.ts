import bcrypt from "bcryptjs";
import {
  IN_PRODUCTION,
  //LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  //REGEX_VALIDATION_ERROR,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import {
  createAccessToken,
  createRefreshToken,
  uploadImage,
  copyToClipboard,
} from "../../utilities";
import { androidFirebaseOptions, iosFirebaseOptions } from "../../config";
//import { isValidString } from "../../libraries/validators/validateString";
//import { validatePassword } from "../../libraries/validators/validatePassword";

export const signUp: MutationResolvers["signUp"] = async (_parent, args) => {
  const userWithEmailExists = await User.exists({
    email: args.data.email.toLowerCase(),
  });

  if (userWithEmailExists === true) {
    throw new errors.ConflictError(
      IN_PRODUCTION !== true
        ? "Email already exists"
        : requestContext.translate("email.alreadyExists"),
      "email.alreadyExists",
      "email"
    );
  }

  // TODO: this check is to be removed
  let organization;
  if (args.data.organizationUserBelongsToId) {
    organization = await Organization.findOne({
      _id: args.data.organizationUserBelongsToId,
    }).lean();

    if (!organization) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND_ERROR.DESC
          : requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }
  }

  // // Checks if the recieved arguments are valid according to standard input norms
  // const validationResult_firstName = isValidString(args.data!.firstName, 50);
  // const validationResult_lastName = isValidString(args.data!.lastName, 50);
  // const validationResult_Password = validatePassword(args.data!.password!);
  // if (!validationResult_firstName.isFollowingPattern) {
  //   throw new errors.InputValidationError(
  //     requestContext.translate(
  //       `${REGEX_VALIDATION_ERROR.MESSAGE} in first name`
  //     ),
  //     REGEX_VALIDATION_ERROR.CODE
  //   );
  // }
  // if (!validationResult_firstName.isLessThanMaxLength) {
  //   throw new errors.InputValidationError(
  //     requestContext.translate(
  //       `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in first name`
  //     ),
  //     LENGTH_VALIDATION_ERROR.CODE
  //   );
  // }
  // if (!validationResult_lastName.isFollowingPattern) {
  //   throw new errors.InputValidationError(
  //     requestContext.translate(
  //       `${REGEX_VALIDATION_ERROR.MESSAGE} in last name`
  //     ),
  //     REGEX_VALIDATION_ERROR.CODE
  //   );
  // }
  // if (!validationResult_lastName.isLessThanMaxLength) {
  //   throw new errors.InputValidationError(
  //     requestContext.translate(
  //       `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in last name`
  //     ),
  //     LENGTH_VALIDATION_ERROR.CODE
  //   );
  // }
  // if (!validationResult_Password) {
  //   throw new errors.InputValidationError(
  //     requestContext.translate(
  //       `The password must contain a mixture of uppercase, lowercase, numbers, and symbols and must be greater than 8, and less than 50 characters`
  //     ),
  //     `Invalid Password`
  //   );
  // }

  const hashedPassword = await bcrypt.hash(args.data.password, 12);

  // Upload file
  let uploadImageObj;
  if (args.file) {
    uploadImageObj = await uploadImage(args.file, null);
  }

  const createdUser = await User.create({
    ...args.data,
    organizationUserBelongsTo: organization ? organization._id : null,
    email: args.data.email.toLowerCase(), // ensure all emails are stored as lowercase to prevent duplicated due to comparison errors
    image: uploadImageObj
      ? uploadImageObj.imageAlreadyInDbPath
        ? uploadImageObj.imageAlreadyInDbPath
        : uploadImageObj.newImagePath
      : null,
    password: hashedPassword,
  });

  const accessToken = await createAccessToken(createdUser);
  const refreshToken = await createRefreshToken(createdUser);

  copyToClipboard(`{
    "Authorization": "Bearer ${accessToken}"
  }`);

  const filteredCreatedUser = createdUser.toObject();

  // @ts-ignore
  delete filteredCreatedUser.password;

  return {
    user: filteredCreatedUser,
    accessToken,
    refreshToken,
    androidFirebaseOptions,
    iosFirebaseOptions,
  };
};
