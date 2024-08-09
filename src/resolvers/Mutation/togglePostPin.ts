import mongoose from "mongoose";
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
import type {
  InterfaceAppUserProfile,
  InterfacePost,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Organization, Post, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Toggles the pinning status of a post within an organization.
 *
 * This function allows an authorized user, such as an organization admin or super admin, to pin or unpin a post within an organization. If the post is already pinned, it will be unpinned, and if it is not pinned, it will be pinned. The function ensures that only authorized users can perform this action and that the title provided for pinning meets validation requirements.
 *
 * @param _parent - This parameter represents the parent resolver in the GraphQL schema and is not used in this function.
 * @param args - The arguments passed to the GraphQL mutation, including the post's `id` and optionally the `title` to be used if pinning the post.
 * @param context - Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.
 *
 * @returns The updated post object after the pinning status has been toggled.
 *
 */
export const togglePostPin: MutationResolvers["togglePostPin"] = async (
  _parent,
  args,
  context,
) => {
  // Get the current user from the cache or database
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  // Check if the user exists
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Get the current user's app profile from the cache or database
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }

  // Check if the user's app profile exists
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Get the post from the cache or database
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

  // Check if the post exists
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the user is authorized to pin or unpin the post
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organizationId) =>
      organizationId &&
      new mongoose.Types.ObjectId(organizationId.toString()).equals(
        post?.organization,
      ),
  );

  if (!currentUserAppProfile.isSuperAdmin && !currentUserIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
      USER_NOT_AUTHORIZED_TO_PIN.CODE,
      USER_NOT_AUTHORIZED_TO_PIN.PARAM,
    );
  }

  // Toggle the pinning status of the post within the organization
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
    new mongoose.Types.ObjectId(postID.toString()).equals(args.id),
  );

  if (currentPostIsPinned) {
    // Unpin the post if it is currently pinned
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
    // Pin the post if it is not currently pinned
    if (!args.title) {
      throw new errors.InputValidationError(
        requestContext.translate(PLEASE_PROVIDE_TITLE.MESSAGE),
        PLEASE_PROVIDE_TITLE.CODE,
      );
    }

    // Validate the title length if provided
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
