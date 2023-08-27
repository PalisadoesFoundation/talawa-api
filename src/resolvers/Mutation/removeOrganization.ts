import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  User,
  Organization,
  Post,
  Comment,
  MembershipRequest,
} from "../../models";
import { superAdminCheck } from "../../utilities";
import {
  USER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { deleteOrganizationFromCache } from "../../services/OrganizationCache/deleteOrganizationFromCache";
/**
 * This function enables to remove an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the organization exists
 * 3. If the user is the creator of the organization.
 * @returns Updated user.
 */
export const removeOrganization: MutationResolvers["removeOrganization"] =
  async (_parent, args, context) => {
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

    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([args.id]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache[0] == null) {
      organization = await Organization.findOne({
        _id: args.id,
      }).lean();

      await cacheOrganizations([organization!]);
    }

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }
    // Checks whether currentUser is a SUPERADMIN
    superAdminCheck(currentUser);

    // Remove each post and comments associated to it for organization.posts list.
    await Post.deleteMany({ _id: { $in: organization.posts } });
    await Comment.deleteMany({ postId: { $in: organization.posts } });

    // Remove organization._id from createdOrganizations list of currentUser.
    await User.updateOne(
      {
        _id: currentUser._id,
      },
      {
        $pull: {
          createdOrganizations: organization._id,
        },
      }
    );

    // Remove organization._id from each member's joinedOrganizations field for organization.members list.
    await User.updateMany(
      { _id: { $in: organization.members } },
      { $pull: { joinedOrganizations: organization._id } }
    );

    // Remove organization._id from each admin's joinedOrganizations field for organization.admins list.
    await User.updateMany(
      { _id: { $in: organization.admins } },
      { $pull: { joinedOrganizations: organization._id } }
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
      }
    );

    /* 
    Remove organization._id from each blockedUser's organizationsBlockedBy
    field for organization.blockedUsers list.
    */
    await User.updateMany(
      { _id: { $in: organization.blockedUsers } },
      { $pull: { organizationsBlockedBy: organization._id } }
    );

    // Deletes the organzation.
    await Organization.deleteOne({
      _id: organization._id,
    });

    await deleteOrganizationFromCache(organization);

    // Returns updated currentUser.
    return await User.findOne({
      _id: currentUser._id,
    })
      .select(["-password"])
      .lean();
  };
