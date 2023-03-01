import {
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post, Organization } from "../../models";

export const togglePinnedPost: MutationResolvers["togglePinnedPost"] = async (
  _parent,
  args,
  context
) => {
  // Check if the user requesting the action exits
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Check if the post object exists
  const post = await Post.findOne({
    _id: args.id,
  }).lean();

  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }

  // Check if the current user is authorized to perform the operation
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  if (
    !(
      currentUser!.userType === "SUPERADMIN" ||
      currentUser!.adminFor
        .map((id) => id.toString())
        .includes(post.organization.toString())
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.message),
      USER_NOT_AUTHORIZED_TO_PIN.code,
      USER_NOT_AUTHORIZED_TO_PIN.param
    );
  }

  // Toggle the post's status for the organization
  const organization = await Organization.findOne({
    _id: post.organization,
  }).lean();

  const currentPostIsPinned = organization!.pinnedPosts.some(
    (p) => p.toString() === args.id.toString()
  );

  if (currentPostIsPinned) {
    await Organization.findOneAndUpdate(
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
    ).lean();
  } else {
    await Organization.findOneAndUpdate(
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
    ).lean();
  }

  return post;
};
