import {
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_IMAGE_NOT_FOUND_MESSAGE,
  ORGANIZATION_IMAGE_NOT_FOUND_CODE,
  ORGANIZATION_IMAGE_NOT_FOUND_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import { adminCheck, deleteImage } from "../../utilities";

export const removeOrganizationImage: MutationResolvers["removeOrganizationImage"] =
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

    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization
    adminCheck(context.userId, organization);

    // Checks whether organization.image exists.
    if (!organization.image) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_IMAGE_NOT_FOUND_MESSAGE),
        ORGANIZATION_IMAGE_NOT_FOUND_CODE,
        ORGANIZATION_IMAGE_NOT_FOUND_PARAM
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
