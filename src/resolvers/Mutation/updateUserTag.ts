import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, OrganizationTagUser } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
  NO_CHANGE_IN_TAG_NAME,
  TAG_ALREADY_EXISTS,
} from "../../constants";

export const updateUserTag: MutationResolvers["updateUserTag"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Get the tag object
  const existingTag = await OrganizationTagUser.findOne({
    _id: args.input._id,
  }).lean();

  if (!existingTag) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.equals(existingTag?.organizationId)
  );

  // Checks whether currentUser can update the tag
  if (
    !(currentUser.userType === "SUPERADMIN") &&
    !currentUserIsOrganizationAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Throw error if the new tag name is the same as the old one
  if (existingTag!.name === args.input.name) {
    throw new errors.ConflictError(
      requestContext.translate(NO_CHANGE_IN_TAG_NAME.MESSAGE),
      NO_CHANGE_IN_TAG_NAME.CODE,
      NO_CHANGE_IN_TAG_NAME.PARAM
    );
  }

  // Check if another tag with the new name exists under the same parent tag
  const anotherTagExists = await OrganizationTagUser.exists({
    name: args.input.name,
    parentTagId: existingTag!.parentTagId,
    organizationId: existingTag!.organizationId,
  });

  if (anotherTagExists) {
    throw new errors.ConflictError(
      requestContext.translate(TAG_ALREADY_EXISTS.MESSAGE),
      TAG_ALREADY_EXISTS.CODE,
      TAG_ALREADY_EXISTS.PARAM
    );
  }

  // Update the title of the tag and return it
  return await OrganizationTagUser.findOneAndUpdate(
    {
      _id: args.input._id,
    },
    {
      name: args.input.name,
    },
    {
      new: true,
    }
  ).lean();
};
