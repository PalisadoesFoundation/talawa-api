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

  const requestUser = await User.exists({
    _id: args.userId,
  });

  // Checks whether currentUser and the requestUser both exist.
  if (!currentUser || !requestUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Get the tag object
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
  // Check that the user shouldn't already be assigned the tag
  const userAlreadyHasTag = tag.users.some(
    (user) => user.toString() === args.userId
  );

  if (userAlreadyHasTag) return false;

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
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Assign the tag
  await Tag.findOneAndUpdate(
    {
      _id: args.tagId,
    },
    {
      $push: {
        users: args.userId,
      },
    }
  );

  return true;
};
