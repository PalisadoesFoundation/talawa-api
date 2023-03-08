import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Tag, TagFolder } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  TAG_FOLDER_NOT_FOUND,
  USER_NOT_AUTHORIZED_TO_CREATE_TAG,
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
  // Get the organizationId from the parent folder
  const parentFolder = await TagFolder.findOne({
    _id: args.tagFolder,
  });

  // Throw an error if the parent tag folder does not exist
  if (!parentFolder) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_FOLDER_NOT_FOUND.message),
      TAG_FOLDER_NOT_FOUND.code,
      TAG_FOLDER_NOT_FOUND.param
    );
  }

  const currentOrganizatonId = parentFolder.organization;

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

  // Create new tag
  const createdTag = await Tag.create({
    title: args.tagName,
    parent: args.tagFolder,
  });

  return createdTag.toObject();
};
