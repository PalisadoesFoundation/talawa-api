import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Tag, UserTag } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Get the tag  object
  const tag = await Tag.findOne({
    _id: args.tagId,
  });

  if (!tag) {
    throw new errors.NotFoundError(
      TAG_NOT_FOUND.MESSAGE,
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag folder.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === tag.organization.toString()
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

  // Get all the subfolders of the tag (including itself)
  // using a graph lookup aggregate query on the Tag model
  const TOP_LEVEL_PARENT = tag._id;
  const allTags = await Tag.aggregate([
    {
      $graphLookup: {
        from: "Tag",
        startWith: "$parentTagId",
        connectFromField: "parentTagId",
        connectToField: "_id",
        as: "hierarchy",
      },
    },
    {
      $match: {
        $or: [{ "hierarchy._id": TOP_LEVEL_PARENT }, { _id: TOP_LEVEL_PARENT }],
      },
    },
  ]);

  const allTagIds = allTags.map(({ _id }: { _id: string }) => _id);

  // Delete all the tags
  await Tag.deleteMany({
    _id: {
      $in: allTagIds,
    },
  });

  // Delete all the tag entries in the UserTag table
  await UserTag.deleteMany({
    tagId: {
      $in: allTagIds,
    },
  });

  return tag!;
};
