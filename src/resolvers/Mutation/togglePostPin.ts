import {
  POST_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfacePost } from "../../models";
import { User, Post, Organization } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { Types } from "mongoose";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { storeTransaction } from "../../utilities/storeTransaction";

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
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    post.organization,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache[0] == null) {
    organization = await Organization.findOne({
      _id: post.organization,
    }).lean();

    await cacheOrganizations([organization!]);
  }
  const currentPostIsPinned = organization?.pinnedPosts.some((postID) =>
    Types.ObjectId(postID).equals(args.id)
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
      }
    );
    storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Organization",
      `Organization:${args.id} updated pinnedPosts`
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
        },
      }
    ).lean();
    storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Post",
      `Post:${args.id} updated pinned`
    );

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    return updatedPost!;
  } else {
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
      }
    );
    storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Organization",
      `Organization:${args.id} updated pinnedPosts`
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
        },
      }
    ).lean();
    storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Post",
      `Post:${args.id} updated pinned`
    );

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    return updatedPost!;
  }
};
