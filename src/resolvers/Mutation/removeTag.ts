import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Tag } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  TAG_NOT_FOUND,
} from "../../constants";

export const removeTag: MutationResolvers["removeTag"] = async (
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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Get the current tag object
  const tag = await Tag.findOne({
    _id: args.tagID,
  });

  if (!tag) {
    throw new errors.NotFoundError(
      TAG_NOT_FOUND.message,
      TAG_NOT_FOUND.code,
      TAG_NOT_FOUND.param
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === tag!.organization.toString()
  );

  // Checks whether currentUser can delete the tag or not.
  if (
    !currentUserIsOrganizationAdmin &&
    !(currentUser.userType === "SUPERADMIN")
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Delete the tag object
  await Tag.deleteOne({
    _id: args.tagID,
  });

  return tag!;
};
