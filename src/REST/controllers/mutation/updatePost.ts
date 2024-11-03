import type { Response } from "express";
import { Types } from "mongoose";
import {
  INTERNAL_SERVER_ERROR,
  LENGTH_VALIDATION_ERROR,
  PLEASE_PROVIDE_TITLE,
  POST_NEEDS_TO_BE_PINNED,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../constants";
import { errors, requestContext } from "../../../libraries";
import { isValidString } from "../../../libraries/validators/validateString";
import type {
  InterfaceAppUserProfile,
  InterfacePost,
  InterfaceUser,
} from "../../../models";
import { AppUserProfile, Post, User } from "../../../models";
import { cachePosts } from "../../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../../services/PostCache/findPostsInCache";
import { findUserInCache } from "../../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../../services/UserCache/cacheUser";
import { findAppUserProfileCache } from "../../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheAppUserProfile } from "../../../services/AppUserProfileCache/cacheAppUserProfile";
import type { InterfaceAuthenticatedRequest } from "../../../middleware";
import { deleteFile, uploadFile } from "../../services/file";

interface InterfaceUpdatePostRequestBody {
  title?: string;
  text?: string;
  pinned?: boolean;
}

/**
 * Controller for updating existing posts within organizations
 */

/**
 * Updates an existing post
 * async
 * function - updatePost
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @throws NotFoundError - When user or post is not found
 * @throws UnauthorizedError - When user lacks permissions to update the post
 * @throws InputValidationError - When title/text validation fails or pinned status requirements aren't met
 * @returns Promise<void> - Responds with updated post or error
 *
 * Description
 * This controller handles post updates with the following features:
 * - Validates user permissions (creator, organization admin, or super admin)
 * - Supports file attachment updates with cleanup of old files
 * - Enforces business rules for pinned posts and titles
 * - Validates content length restrictions
 * - Maintains cache consistency
 *
 * Request body expects:
 * ```typescript
 * {
 *   title?: string;
 *   text?: string;
 *   pinned?: boolean;
 * }
 * ```
 *
 * Authorization Rules:
 * - Post creator can edit their own posts
 * - Organization admins can edit posts in their organizations
 * - Super admins can edit any post
 */

export const updatePost = async (
  req: InterfaceAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId;
  const postId = req.params.id;
  const { title, text, pinned }: InterfaceUpdatePostRequestBody = req.body;

  try {
    // Get the current user
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([userId as string]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({ _id: userId }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Get current user's app profile
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

    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Get the post
    let post: InterfacePost | null;
    const postFoundInCache = await findPostsInCache([postId]);
    post = postFoundInCache[0];
    if (post === null) {
      post = await Post.findOne({ _id: postId }).populate("file").lean();
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

    // Check if the user has the right to update the post
    const currentUserIsPostCreator = post.creatorId.equals(userId);
    const isSuperAdmin = currentUserAppProfile.isSuperAdmin;
    const isAdminOfPostOrganization = currentUserAppProfile?.adminFor.some(
      (orgID) =>
        orgID &&
        new Types.ObjectId(orgID?.toString()).equals(post?.organization),
    );

    if (
      !currentUserIsPostCreator &&
      !isAdminOfPostOrganization &&
      !isSuperAdmin
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Handle file upload and cleanup
    let fileId: string | undefined;
    const oldFileId = post.file?._id?.toString();
    const oldObjectKey = post.file.metadata?.objectKey;

    if (req.file) {
      // Upload new file
      const response = await uploadFile(req, res);
      fileId = response._id?.toString();

      // Clean up old file if it exists
      if (oldFileId && oldObjectKey) {
        await deleteFile(oldObjectKey, oldFileId);
      }
    }

    // Validate title and pinned status
    if (title && !post.pinned) {
      throw new errors.InputValidationError(
        requestContext.translate(POST_NEEDS_TO_BE_PINNED.MESSAGE),
        POST_NEEDS_TO_BE_PINNED.CODE,
      );
    } else if (!title && post.pinned) {
      throw new errors.InputValidationError(
        requestContext.translate(PLEASE_PROVIDE_TITLE.MESSAGE),
        PLEASE_PROVIDE_TITLE.CODE,
      );
    }

    // Validate input lengths
    if (title) {
      const validationResultTitle = isValidString(title, 256);
      if (!validationResultTitle.isLessThanMaxLength) {
        throw new errors.InputValidationError(
          requestContext.translate(
            `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
          ),
          LENGTH_VALIDATION_ERROR.CODE,
        );
      }
    }

    if (text) {
      const validationResultText = isValidString(text, 500);
      if (!validationResultText.isLessThanMaxLength) {
        throw new errors.InputValidationError(
          requestContext.translate(
            `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
          ),
          LENGTH_VALIDATION_ERROR.CODE,
        );
      }
    }

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        ...(title && { title }),
        ...(text && { text }),
        ...(pinned !== undefined && { pinned }),
        ...(fileId && { file: fileId }),
      },
      { new: true },
    ).lean();

    if (updatedPost !== null) {
      await cachePosts([updatedPost]);
    }

    res.status(200).json({
      post: updatedPost,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({
        error: requestContext.translate(INTERNAL_SERVER_ERROR.MESSAGE),
      });
    }
  }
};
