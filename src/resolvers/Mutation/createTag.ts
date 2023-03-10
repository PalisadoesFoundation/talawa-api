import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Tag, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_TO_CREATE_TAG,
  INCORRECT_TAG_INPUT,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  INVALID_TAG_INPUT,
  TAG_NOT_FOUND,
} from "../../constants";

export const createTag: MutationResolvers["createTag"] = async (
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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Check that atleast one of the two optional arguments must be provided
  if (!args.organizationId && !args.parentTag)
    throw new errors.InputValidationError(
      INVALID_TAG_INPUT.message,
      INVALID_TAG_INPUT.code,
      INVALID_TAG_INPUT.param
    );

  let currentOrganizatonId: null | string = null;
  // Creating the tag at the root of the organization
  if (args.organizationId) {
    const organizationExists = await Organization.exists({
      _id: args.organizationId,
    });

    // Checks whether organization with _id == args.organizationId exists.
    if (!organizationExists) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    currentOrganizatonId = args.organizationId;
  } else {
    // Get the organizationId from the parent folder
    const parentTag = await Tag.findOne({
      _id: args.parentTag!,
    });

    // Throw an error if the parent tag folder does not exist
    if (!parentTag) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_NOT_FOUND.message),
        TAG_NOT_FOUND.code,
        TAG_NOT_FOUND.param
      );
    }

    // If the user has sent both the optional paramaters, then as an additional check the
    // tag must belong to the organization provided
    if (
      currentOrganizatonId &&
      currentOrganizatonId !== parentTag.organization.toString()
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(INCORRECT_TAG_INPUT.message),
        INCORRECT_TAG_INPUT.code,
        INCORRECT_TAG_INPUT.param
      );
    }

    currentOrganizatonId = parentTag.organization;
  }

  // Check if the user has privileges to pin the post
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organizationId) => organizationId.toString() === currentOrganizatonId!
  );

  if (
    !(currentUser!.userType === "SUPERADMIN") &&
    !currentUserIsOrganizationAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_CREATE_TAG.message),
      USER_NOT_AUTHORIZED_TO_CREATE_TAG.code,
      USER_NOT_AUTHORIZED_TO_CREATE_TAG.param
    );
  }

  // Creates new tag
  const createdTag = await Tag.create({
    title: args.title,
    organization: currentOrganizatonId,
    parentTag: args.parentTag ? args.parentTag : null,
  });

  return createdTag;
};
