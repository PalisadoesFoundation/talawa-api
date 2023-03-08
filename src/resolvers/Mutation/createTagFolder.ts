import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization, TagFolder } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  TAG_FOLDER_NOT_FOUND,
  USER_NOT_AUTHORIZED_TO_CREATE_TAG_FOLDER,
  INVALID_TAG_INPUT,
} from "../../constants";

export const createTagFolder: MutationResolvers["createTagFolder"] = async (
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
  if (!args.organizationId && !args.parentFolder)
    throw new errors.InputValidationError(
      INVALID_TAG_INPUT.message,
      INVALID_TAG_INPUT.code,
      INVALID_TAG_INPUT.param
    );

  // Get the current organizationID
  let currentOrganizatonId: string | null = null;

  // The organizationId can be suplied directly as an argument
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
    const parentFolder = await TagFolder.findOne({
      _id: args.parentFolder!,
    });

    // Throw an error if the parent tag folder does not exist
    if (!parentFolder) {
      throw new errors.NotFoundError(
        requestContext.translate(TAG_FOLDER_NOT_FOUND.message),
        TAG_FOLDER_NOT_FOUND.code,
        TAG_FOLDER_NOT_FOUND.param
      );
    }

    currentOrganizatonId = parentFolder.organization;
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
      requestContext.translate(
        USER_NOT_AUTHORIZED_TO_CREATE_TAG_FOLDER.message
      ),
      USER_NOT_AUTHORIZED_TO_CREATE_TAG_FOLDER.code,
      USER_NOT_AUTHORIZED_TO_CREATE_TAG_FOLDER.param
    );
  }

  // Creates new tag folder
  const createdTagFolder = await TagFolder.create({
    title: args.title,
    organization: currentOrganizatonId,
    parent: args.parentFolder ? args.parentFolder : null,
  });

  return createdTagFolder.toObject();
};
