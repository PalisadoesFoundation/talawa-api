import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Tag } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
} from "../../constants";

export const updateTag: MutationResolvers["updateTag"] = async (
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

  // Get the tag folder object
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

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === tag!.organization.toString()
  );

  // Checks whether currentUser cannot delete the tag folder.
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

  // Update the title of the tag folder
  const updatedTag = await Tag.findOneAndUpdate(
    {
      _id: args.tagId,
    },
    {
      title: args.newName,
    }
  );

  return updatedTag!;
};
