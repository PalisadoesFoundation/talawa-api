import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Tag, TagUser } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
} from "../../constants";

export const unassignTag: MutationResolvers["unassignTag"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  const requestUser = await User.exists({
    _id: args.userId,
  });

  // Checks whether currentUser and the requestUser both exist.
  if (!currentUser || !requestUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Get the tag object
  const tag = await Tag.findOne({
    _id: args.tagId,
  }).lean();

  if (!tag) {
    throw new errors.NotFoundError(
      TAG_NOT_FOUND.MESSAGE,
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM
    );
  }
  // Check that the user should already be assigned the tag
  const userAlreadyHasTag = await TagUser.exists({
    user: args.userId,
    tag: args.tagId,
  });

  if (!userAlreadyHasTag) return false;

  // Boolean to determine whether user is an admin of organization of the tag.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === tag!.organization.toString()
  );

  // Checks whether currentUser cannot delete the tag folder.
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

  // Unassign the tag
  await TagUser.deleteOne({
    user: args.userId,
    tag: args.tagId,
  });

  return true;
};
