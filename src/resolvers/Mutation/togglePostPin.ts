import { Types } from "mongoose";
import {
  LENGTH_VALIDATION_ERROR,
  PLEASE_PROVIDE_TITLE,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import type { InterfacePost } from "../../models";
import { AppUserProfile, Organization, Post, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

export const togglePostPin: MutationResolvers["togglePostPin"] = async (
  _parent,
  args,
  context,
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
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  // Check if the post object exists
  let post: InterfacePost | null;

  const postFoundInCache = await findPostsInCache([args.id]);

  post = postFoundInCache[0];

  if (postFoundInCache[0] === null) {
    post = await Post.findOne({
      _id: args.id,
    }).lean();
    if (post !== null) {
      await cachePosts([post]);
    }
  }

  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the current user is authorized to perform the operation
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organizationId) =>
      organizationId &&
      new Types.ObjectId(organizationId.toString()).equals(post?.organization),
  );

  if (!currentUserAppProfile.isSuperAdmin && !currentUserIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
      USER_NOT_AUTHORIZED_TO_PIN.CODE,
      USER_NOT_AUTHORIZED_TO_PIN.PARAM,
    );
  }

  // Toggle the post's status for the organization
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    post.organization,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache[0] == null) {
    organization = await Organization.findOne({
      _id: post.organization,
    }).lean();
    if (organization !== null) {
      await cacheOrganizations([organization]);
    }
  }
  const currentPostIsPinned = organization?.pinnedPosts.some((postID) =>
    new Types.ObjectId(postID).equals(args.id),
  );

  if (currentPostIsPinned) {
    const updatedOrganization = await Organization.findOneAndUpdate(
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
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          pinned: false,
          title: "",
        },
      },
    ).lean();

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    return updatedPost as InterfacePost;
  } else {
    if (!args.title) {
      throw new errors.InputValidationError(
        requestContext.translate(PLEASE_PROVIDE_TITLE.MESSAGE),
        PLEASE_PROVIDE_TITLE.CODE,
      );
    }

    if (args?.title) {
      const validationResultTitle = isValidString(args?.title, 256);
      if (!validationResultTitle.isLessThanMaxLength) {
        throw new errors.InputValidationError(
          requestContext.translate(
            `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
          ),
          LENGTH_VALIDATION_ERROR.CODE,
        );
      }
    }

    const updatedOrganization = await Organization.findOneAndUpdate(
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
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: {
          pinned: true,
          title: args?.title,
        },
      },
    ).lean();

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    return updatedPost as InterfacePost;
  }
};
