import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, OrganizationTagUser, TagUser } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
  USER_ALREADY_HAS_TAG,
} from "../../constants";

export const assignUserTag: MutationResolvers["assignUserTag"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether the currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Get the tag object
  const tag = await OrganizationTagUser.findOne({
    _id: args.input.tagId,
  }).lean();

  if (!tag) {
    throw new errors.NotFoundError(
      requestContext.translate(TAG_NOT_FOUND.MESSAGE),
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === tag!.organizationId.toString()
  );

  // Checks whether currentUser can assign the tag or not.
  if (
    !currentUserIsOrganizationAdmin &&
    !(currentUser.userType === "SUPERADMIN")
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Check if the request user (to whom the tag is to be assigned) exists
  const requestUser = await User.findOne({
    _id: args.input.userId,
  }).lean();

  if (!requestUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check that the user to which the tag is to be assigned is a member of the tag's organization
  const requestUserBelongsToTagOrganization =
    requestUser.joinedOrganizations.some(
      (organization) =>
        organization.toString() === tag!.organizationId.toString()
    );

  if (!requestUserBelongsToTagOrganization) {
    throw new errors.UnauthorizedError(
      requestContext.translate(
        USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE
      ),
      USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.CODE,
      USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.PARAM
    );
  }

  // Check if the user already has been assigned the tag
  const userAlreadyHasTag = await TagUser.exists({
    ...args.input,
  });

  if (userAlreadyHasTag) {
    throw new errors.ConflictError(
      requestContext.translate(USER_ALREADY_HAS_TAG.MESSAGE),
      USER_ALREADY_HAS_TAG.CODE,
      USER_ALREADY_HAS_TAG.PARAM
    );
  }

  // Assign the tag
  await TagUser.create({
    ...args.input,
  });

  return requestUser;
};
