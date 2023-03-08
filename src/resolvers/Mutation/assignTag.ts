import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, TagFolder, Tag } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  USER_ALREADY_HAS_TAG,
} from "../../constants";
import { TAG_NOT_FOUND } from "../../constants";

export const assignTag: MutationResolvers["assignTag"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  const requestedUser = await User.findOne({ _id: args.userId }).lean();

  // Checks whether currentUser exists.
  if (!currentUser || !requestedUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Check that the user shouldn't already be assigned the tag
  const userAlreadyHasTag = requestedUser.tags.some(
    (tag) => tag.toString() === args.tagId
  );

  if (userAlreadyHasTag) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_ALREADY_HAS_TAG.message),
      USER_ALREADY_HAS_TAG.code,
      USER_ALREADY_HAS_TAG.param
    );
  }

  // Get the tag folder object
  const tag = await Tag.findOne({
    _id: args.tagId,
  }).lean();

  if (!tag) {
    throw new errors.NotFoundError(
      TAG_NOT_FOUND.message,
      TAG_NOT_FOUND.code,
      TAG_NOT_FOUND.param
    );
  }

  const tagFolder = await TagFolder.findOne({
    _id: tag!.folder,
  });

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) =>
      organization.toString() === tagFolder!.organization.toString()
  );

  // Checks whether currentUser cannot delete the tag folder.
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

  // Update the user
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: args.userId,
    },
    {
      $pull: {
        tags: args.tagId,
      },
    }
  );

  return updatedUser!;
};
