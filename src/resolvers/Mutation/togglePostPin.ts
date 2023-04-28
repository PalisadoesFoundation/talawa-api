import {
  POST_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post, Organization } from "../../models";

export const togglePostPin: MutationResolvers["togglePostPin"] = async (
  _parent,
  args,
  context
) => {
  // Get the current user
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Check if the user requesting the action exits
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check if the post object exists
  const post = await Post.findOne({
    _id: args.id,
  }).lean();

  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check if the current user is authorized to perform the operation
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organizationId) => organizationId.equals(post?.organization)
  );

  if (
    !((currentUser?.userType ?? "") === "SUPERADMIN") &&
    !currentUserIsOrganizationAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
      USER_NOT_AUTHORIZED_TO_PIN.CODE,
      USER_NOT_AUTHORIZED_TO_PIN.PARAM
    );
  }

  // Toggle the post's status for the organization
  const organization = await Organization.findOne({
    _id: post.organization,
  }).lean();

  const currentPostIsPinned = organization?.pinnedPosts.some((postID) =>
    postID.equals(args.id)
  );

  if (currentPostIsPinned) {
    await Organization.updateOne(
      {
        _id: post.organization,
      },
      {
        $pull: {
          pinnedPosts: args.id,
        },
      },
      {
        new: true,
      }
    );
    return await Post.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          pinned: false,
        },
      }
    ).lean();
  } else {
    await Organization.updateOne(
      {
        _id: post.organization,
      },
      {
        $push: {
          pinnedPosts: args.id,
        },
      },
      {
        new: true,
      }
    );
    return await Post.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          pinned: true,
        },
      }
    ).lean();
  }
};
