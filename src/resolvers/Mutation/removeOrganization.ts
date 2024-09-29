import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  ActionItem,
  ActionItemCategory,
  AppUserProfile,
  Comment,
  Fund,
  MembershipRequest,
  Organization,
  Post,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { deleteAppUserFromCache } from "../../services/AppUserProfileCache/deleteAppUserFromCache";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";

import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { deleteOrganizationFromCache } from "../../services/OrganizationCache/deleteOrganizationFromCache";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { deleteUserFromCache } from "../../services/UserCache/deleteUserFromCache";
import { findUserInCache } from "../../services/UserCache/findUserInCache";

import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
import { deletePreviousImage as deleteImage } from "../../utilities/encodedImageStorage/deletePreviousImage";
/**
 * This function enables to remove an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the organization exists
 * 3. If the user is the creator of the organization.
 * 4. If the user has appUserProfile.
 * @returns Updated user.
 */
export const removeOrganization: MutationResolvers["removeOrganization"] =
  async (_parent, args, context) => {
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

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
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

    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([args.id]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache[0] == null) {
      organization = await Organization.findOne({
        _id: args.id,
      }).lean();
      if (organization != null) {
        await cacheOrganizations([organization]);
      }
    }

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }
    // Checks whether currentUser is a SUPERADMIN
    superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

    // Remove each post and comments associated to it for organization.posts list.
    await Post.deleteMany({ _id: { $in: organization.posts } });
    await Comment.deleteMany({ postId: { $in: organization.posts } });

    // Remove organization._id from createdOrganizations list of currentUserAppProfile*.
    await AppUserProfile.updateOne(
      {
        _id: currentUserAppProfile._id,
      },
      {
        $pull: {
          createdOrganizations: organization._id,
        },
      },
    );

    // Remove organization._id from each member's joinedOrganizations field for organization.members list.
    await User.updateMany(
      { _id: { $in: organization.members } },
      { $pull: { joinedOrganizations: organization._id } },
    );

    // Remove organization._id from each admin's joinedOrganizations field for organization.admins list.
    await User.updateMany(
      { _id: { $in: organization.admins } },
      { $pull: { joinedOrganizations: organization._id } },
    );

    /*
    Remove membershipRequest._id from each requester's membershipRequests
    field for membershipRequest.user for organization.membershipRequests list.
    */
    const membershipRequests = await MembershipRequest.find({
      _id: { $in: organization.membershipRequests },
    });

    await MembershipRequest.deleteMany({
      _id: { $in: organization.membershipRequests },
    });

    await User.updateMany(
      { _id: { $in: membershipRequests.map((r) => r.user._id) } },
      {
        $pull: {
          membershipRequests: { $in: organization.membershipRequests },
        },
      },
    );

    /* 
    Remove organization._id from each blockedUser's organizationsBlockedBy
    field for organization.blockedUsers list.
    */
    await User.updateMany(
      { _id: { $in: organization.blockedUsers } },
      { $pull: { organizationsBlockedBy: organization._id } },
    );

    // Get the ids of all ActionItemCategories associated with the organization
    const actionItemCategories = await ActionItemCategory.find({
      organizationId: organization?._id,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    // Remove all ActionItemCategory documents whose id is in the actionItemCategories array
    await ActionItemCategory.deleteMany({
      _id: { $in: actionItemCategoriesIds },
    });

    // Remove all ActionItem documents whose actionItemCategory is in the actionItemCategories array
    await ActionItem.deleteMany({
      actionItemCategory: { $in: actionItemCategoriesIds },
    });
    //Remove all the funds specific to organization
    await Fund.deleteMany({
      _id: { $in: organization.funds },
    });
    // Deletes the organzation.
    await Organization.deleteOne({
      _id: organization._id,
    });

    await deleteOrganizationFromCache(organization);

    if (organization?.image) {
      await deleteImage(organization?.image);
    }
    const updatedUser: InterfaceUser = (await User.findOne({
      _id: currentUser._id,
    })
      .select(["-password"])
      .lean()) as InterfaceUser;
    const updatedAppUserProfile: InterfaceAppUserProfile =
      (await AppUserProfile.findOne({
        userId: currentUser._id,
      })
        .populate("createdOrganizations")
        .populate("createdEvents")
        .populate("eventAdmin")
        .populate("adminFor")
        .lean()) as InterfaceAppUserProfile;

    if (updatedUser) {
      await deleteUserFromCache(updatedUser._id.toString());
      await cacheUsers([updatedUser]);
    }
    if (updatedAppUserProfile) {
      await deleteAppUserFromCache(updatedAppUserProfile._id.toString());
      await cacheAppUserProfile([updatedAppUserProfile]);
    }

    // Returns updated currentUser.
    return {
      user: updatedUser,
      appUserProfile: updatedAppUserProfile,
    };
  };
