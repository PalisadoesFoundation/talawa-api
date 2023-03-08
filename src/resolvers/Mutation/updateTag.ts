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
} from "../../constants";
import { TAG_NOT_FOUND } from "../../constants";

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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Get the tag folder object
  const tag = await Tag.findOne({
    _id: args.tagID,
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

  // Update the title of the tag folder
  const updatedTag = await Tag.findOneAndUpdate(
    {
      _id: args.tagID,
    },
    {
      title: args.newName,
    }
  );

  return updatedTag;
};
