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
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organizationId) =>
      organizationId.toString() === post!.organization.toString()
  );

  if (
    !(currentUser!.userType === "SUPERADMIN") &&
    !currentUserIsOrganizationAdmin
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
    (postID) => postID.toString() === args.id.toString()
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
