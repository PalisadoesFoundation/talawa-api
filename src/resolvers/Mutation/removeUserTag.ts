import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, OrganizationTagUser, TagUser } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
} from "../../constants";

export const removeUserTag: MutationResolvers["removeUserTag"] = async (
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

  // Get the tag object
  const tag = await OrganizationTagUser.findOne({
    _id: args.id,
  });

  if (!tag) {
    throw new errors.NotFoundError(
      TAG_NOT_FOUND.MESSAGE,
      TAG_NOT_FOUND.CODE,
      TAG_NOT_FOUND.PARAM
    );
  }

  // Boolean to determine whether user is an admin of organization of the tag
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === tag.organizationId.toString()
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

  // Get all the child tags of the current tag (including itself)
  // using a graph lookup aggregate query on the OrganizationTagUser model
  const TOP_LEVEL_PARENT = tag._id;

  const allTags = await OrganizationTagUser.aggregate([
    {
      $graphLookup: {
        from: "OrganizationTagUser",
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
  await OrganizationTagUser.deleteMany({
    _id: {
      $in: allTagIds,
    },
  });

  // Delete all the tag entries in the TagUser model
  await TagUser.deleteMany({
    tagId: {
      $in: allTagIds,
    },
  });

  return tag!;
};
