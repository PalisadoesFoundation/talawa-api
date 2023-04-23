import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, OrganizationTagUser, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_CREATE_TAG,
  INCORRECT_TAG_INPUT,
  ORGANIZATION_NOT_FOUND_ERROR,
  TAG_NOT_FOUND,
  TAG_ALREADY_EXISTS,
} from "../../constants";

export const createUserTag: MutationResolvers["createUserTag"] = async (
  _parent,
  args,
  context
) => {
  // Get the current user
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

  // Checks if the provided organization exists
  const organizationExists = await Organization.exists({
    _id: args.input.organizationId,
  });

  if (!organizationExists) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check if the user has privileges to create the tag
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organizationId) =>
      organizationId.toString() === args.input.organizationId.toString()
  );

  if (
    !(currentUser!.userType === "SUPERADMIN") &&
    !currentUserIsOrganizationAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_CREATE_TAG.MESSAGE),
      USER_NOT_AUTHORIZED_TO_CREATE_TAG.CODE,
      USER_NOT_AUTHORIZED_TO_CREATE_TAG.PARAM
    );
  }

  // Additonal checks if the parent folder is provided
  if (args.input.parentTagId) {
    const parentTag = await OrganizationTagUser.findOne({
      _id: args.input.parentTagId!,
    });

    // Throw an error if the parent tag folder does not exist
    if (!parentTag) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.MESSAGE),
        TAG_NOT_FOUND.CODE,
        TAG_NOT_FOUND.PARAM
      );
    }

    // The parent folder should belong to the provided organization
    if (
      args.input.organizationId.toString() !==
      parentTag.organizationId.toString()
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(INCORRECT_TAG_INPUT.MESSAGE),
        INCORRECT_TAG_INPUT.CODE,
        INCORRECT_TAG_INPUT.PARAM
      );
    }
  }

  // Check if another tag with the same name exists under the same parent tag
  const anotherTagExists = await OrganizationTagUser.exists({
    ...args.input,
  });

  if (anotherTagExists) {
    throw new errors.ConflictError(
      requestContext.translate(TAG_ALREADY_EXISTS.MESSAGE),
      TAG_ALREADY_EXISTS.CODE,
      TAG_ALREADY_EXISTS.PARAM
    );
  }

  // Creates new tag and returns the same
  const newTag = await OrganizationTagUser.create({
    ...args.input,
  });

  return newTag.toObject();
};
