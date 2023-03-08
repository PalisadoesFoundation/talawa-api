import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Tag, TagFolder, User } from "../../models";
import { errors } from "../../libraries";
import {
  TAG_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { USER_NOT_AUTHORIZED_MESSAGE } from "../../constants";
import { USER_NOT_AUTHORIZED_CODE } from "../../constants";
import { USER_NOT_AUTHORIZED_PARAM } from "../../constants";

export const usersByTag: QueryResolvers["usersByTag"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      context.requestTranslation(USER_NOT_FOUND),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const tag = await Tag.findOne({
    _id: args.tagId,
  }).lean();

  if (!tag) {
    throw new errors.NotFoundError(
      context.requestTranslation(TAG_NOT_FOUND.message),
      TAG_NOT_FOUND.code,
      TAG_NOT_FOUND.param
    );
  }

  const tagFolder = await TagFolder.findOne({
    _id: tag.folder,
  });

  const currentUserBelongsToOrganization = currentUser.joinedOrganizations.some(
    (organizationId) => organizationId.toString() === tagFolder?.organization
  );

  if (!currentUserBelongsToOrganization) {
    throw new errors.UnauthorizedError(
      context.requestTranslation(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  const users = await User.find({
    tags: {
      $elemMatch: {},
    },
  })
    .select(["-password"])
    .populate("createdOrganizations")
    .populate("createdEvents")
    .populate("joinedOrganizations")
    .populate("registeredEvents")
    .populate("eventAdmin")
    .populate("adminFor")
    .lean();

  return users;
};
