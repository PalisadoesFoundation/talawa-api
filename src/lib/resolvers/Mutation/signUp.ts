import bcrypt from "bcryptjs";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../../constants";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import {
  createAccessToken,
  createRefreshToken,
  uploadImage,
  copyToClipboard,
} from "../../utilities";
import { androidFirebaseOptions, iosFirebaseOptions } from "../../config";
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
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }
  }

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
