import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_IMAGE_NOT_FOUND_ERROR,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import { adminCheck, deleteImage } from "../../utilities";
/**
 * This function enables to remove an organization's image.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the organization exists
 * 3. If the user is the admin of the organization.
 * @returns Updated Organization.
 */
export const removeOrganizationImage: MutationResolvers["removeOrganizationImage"] =
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

    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization
    await adminCheck(context.userId, organization);

    // Checks whether organization.image exists.
    if (!organization.image) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_IMAGE_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_IMAGE_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_IMAGE_NOT_FOUND_ERROR.PARAM
      );
    }

    await deleteImage(organization.image);

    // Sets image field of organization to null and returns the updated organization.
    return await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          image: null,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
