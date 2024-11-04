import type { Response } from "express";
import mongoose from "mongoose";
import {
  INTERNAL_SERVER_ERROR,
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  PLEASE_PROVIDE_TITLE,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../../constants";
import { errors, requestContext } from "../../../libraries";
import { isValidString } from "../../../libraries/validators/validateString";
import type {
  InterfaceAppUserProfile,
  InterfaceOrganization,
  InterfaceUser,
} from "../../../models";
import { AppUserProfile, Organization, Post, User } from "../../../models";
import { cacheAppUserProfile } from "../../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheOrganizations } from "../../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../../services/OrganizationCache/findOrganizationsInCache";
import { cachePosts } from "../../../services/PostCache/cachePosts";
import { cacheUsers } from "../../../services/UserCache/cacheUser";
import { findUserInCache } from "../../../services/UserCache/findUserInCache";
import type { InterfaceAuthenticatedRequest } from "../../../middleware";
import { uploadFile } from "../../services/file";

interface InterfaceCreatePostRequestBody {
  organizationId: string;
  title?: string;
  text: string;
  pinned?: boolean;
}

/**
 * Controller for creating posts within organizations
 */

/**
 * Creates a new post within an organization
 * async
 * function - createPost
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @throws NotFoundError - When user or organization is not found
 * @throws UnauthorizedError - When user is not authorized or lacks permissions
 * @throws InputValidationError - When title or text validation fails
 * @returns Promise<void> - Responds with created post or error
 *
 * Description
 * This controller handles post creation with the following features:
 * - Validates user membership in the organization
 * - Supports file attachments
 * - Handles post pinning with proper authorization
 * - Validates title and text length
 * - Caches created posts and updated organizations
 *
 * Request body expects:
 * ```typescript
 * {
 *   organizationId: string;
 *   title?: string;
 *   text: string;
 *   pinned?: boolean;
 * }
 * ```
 */
export const createPost = async (
  req: InterfaceAuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId;
  const {
    organizationId,
    title,
    text,
    pinned,
  }: InterfaceCreatePostRequestBody = req.body;

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

    // Check if currentUser exists
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

    // Get the organization
    let organization: InterfaceOrganization | null;
    const organizationFoundInCache = await findOrganizationsInCache([
      organizationId,
    ]);
    organization = organizationFoundInCache[0];
    if (organization === null) {
      organization = await Organization.findOne({ _id: organizationId }).lean();
      if (organization) {
        await cacheOrganizations([organization]);
      }
    }

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check if user is a member of the organization or a super admin
    const isSuperAdmin = currentUserAppProfile.isSuperAdmin;
    const currentUserIsOrganizationMember = organization.members.some(
      (memberId) =>
        new mongoose.Types.ObjectId(memberId?.toString()).equals(userId),
    );

    if (!currentUserIsOrganizationMember && !isSuperAdmin) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
        USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
        USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
      );
    }

    let fileUploadResponse;
    if (req.file) {
      fileUploadResponse = await uploadFile(req, res);
    }

    // Validate title and pinned status
    if (!title && pinned) {
      throw new errors.InputValidationError(
        requestContext.translate(PLEASE_PROVIDE_TITLE.MESSAGE),
        PLEASE_PROVIDE_TITLE.CODE,
      );
    }

    // Validate title and text length
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

    const validationResultText = isValidString(text, 500);
    if (!validationResultText.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
        ),
        LENGTH_VALIDATION_ERROR.CODE,
      );
    }

    // Check permissions for pinning
    if (pinned) {
      const currentUserIsOrganizationAdmin =
        currentUserAppProfile.adminFor.some((orgId) =>
          new mongoose.Types.ObjectId(orgId?.toString()).equals(organizationId),
        );

      if (
        !(currentUserAppProfile.isSuperAdmin || currentUserIsOrganizationAdmin)
      ) {
        throw new errors.UnauthorizedError(
          requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
          USER_NOT_AUTHORIZED_TO_PIN.CODE,
          USER_NOT_AUTHORIZED_TO_PIN.PARAM,
        );
      }
    }

    // Create the post
    const createdPost = await Post.create({
      title,
      text,
      pinned: pinned || false,
      creatorId: userId,
      organization: organizationId,
      file: fileUploadResponse?._id,
    });

    if (createdPost !== null) {
      await cachePosts([createdPost]);
    }

    // Update organization if post is pinned
    if (pinned) {
      const updatedOrganization = await Organization.findOneAndUpdate(
        { _id: organizationId },
        {
          $push: {
            pinnedPosts: createdPost._id,
          },
        },
        {
          new: true,
        },
      );

      await cacheOrganizations([updatedOrganization as InterfaceOrganization]);
    }

    // Send response
    res.status(201).json({
      post: createdPost,
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
