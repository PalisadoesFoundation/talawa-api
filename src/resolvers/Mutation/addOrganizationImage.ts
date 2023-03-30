import "dotenv/config";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck, getValidOrganizationById } from "../../utilities";
import { User, Organization } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
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
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    const organization = await getValidOrganizationById(args.organizationId);

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    // Upload Image
    const uploadImageFileName = await uploadEncodedImage(
      args.file!,
      organization.image
    );
    // Updates the organization with new image and returns the updated organization.
    return await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          image: uploadImageFileName,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
