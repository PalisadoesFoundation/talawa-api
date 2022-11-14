import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck, uploadImage } from "../../utilities";
import { User, Organization } from "../../models";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function adds Organization Image.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. If the organization exists
 * 3. If the user trying to add the image is an admin of organization
 * @returns Updated Organization
 */
export const addOrganizationImage: MutationResolvers["addOrganizationImage"] =
  async (_parent, args, context) => {
    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    // Checks whether currentUser exists.
    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    adminCheck(context.userId, organization);

    // Upload Image
    const uploadImageObj = await uploadImage(args.file, organization.image!);

    // Updates the organization with new image and returns the updated organization.
    return await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          image: uploadImageObj.imageAlreadyInDbPath
            ? uploadImageObj.imageAlreadyInDbPath
            : uploadImageObj.newImagePath,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
