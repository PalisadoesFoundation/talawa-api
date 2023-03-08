import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, TagFolder } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../constants";
import { TAG_FOLDER_NOT_FOUND } from "../../constants";

export const updateTagFolder: MutationResolvers["updateTagFolder"] = async (
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
  const tagFolder = await TagFolder.findOne({
    _id: args.id!,
  });

  if (!tagFolder) {
    throw new errors.NotFoundError(
      TAG_FOLDER_NOT_FOUND.message,
      TAG_FOLDER_NOT_FOUND.code,
      TAG_FOLDER_NOT_FOUND.param
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) =>
      organization.toString() === tagFolder.organization.toString()
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
  const updatedTagFolder = await TagFolder.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      title: args.title,
    }
  );

  return updatedTagFolder;
};
