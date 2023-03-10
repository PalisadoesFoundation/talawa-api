import { MutationResolvers } from "../../types/generatedGraphQLTypes";
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

    const organization = await Organization.findOne({
      _id: args.id,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }
    // Checks whether currentUser is a SUPERADMIN
    superAdminCheck(currentUser!);

    // Remove each post and comments associated to it for organization.posts list.
    organization.posts.forEach(async (postId) => {
      await Post.deleteOne({
        _id: postId,
      });

      await Comment.deleteMany({
        post: postId,
      });
    });

    // Remove organization._id from createdOrganizations list of currentUser.
    await User.updateOne(
      {
        _id: currentUser._id,
      },
      {
        $set: {
          createdOrganizations: currentUser.createdOrganizations.filter(
            (createdOrganization) =>
              createdOrganization.toString() !== organization._id.toString()
          ),
        },
      }
    );

    // Remove organization._id from each member's joinedOrganizations field for organization.members list.
    for (const memberId of organization.members) {
      const member = await User.findOne({
        _id: memberId,
      }).lean();

      await User.updateOne(
        {
          _id: memberId,
        },
        {
          $set: {
            joinedOrganizations: member?.joinedOrganizations.filter(
              (joinedOrganization) =>
                joinedOrganization.toString() !== organization._id.toString()
            ),
          },
        }
      );
    }

    // Remove organization._id from each admin's joinedOrganizations field for organization.admins list.
    for (const adminId of organization.admins) {
      const admin = await User.findOne({
        _id: adminId,
      }).lean();

      await User.updateOne(
        {
          _id: adminId,
        },
        {
          $set: {
            joinedOrganizations: admin?.joinedOrganizations.filter(
              (joinedOrganization) =>
                joinedOrganization.toString() !== organization._id.toString()
            ),
          },
        }
      );
    }

    /*
    Remove membershipRequest._id from each requester's membershipRequests
    field for membershipRequest.user for organization.membershipRequests list.
    */
    for (const membershipRequestId of organization.membershipRequests) {
      const membershipRequest = await MembershipRequest.findOneAndDelete({
        _id: membershipRequestId,
      }).lean();

      const requester = await User.findOne({
        _id: membershipRequest?.user,
      }).lean();

      await User.updateOne(
        {
          _id: requester?._id,
        },
        {
          $set: {
            membershipRequests: requester?.membershipRequests.filter(
              (request) =>
                request.toString() !== membershipRequest?._id.toString()
            ),
          },
        }
      );
    }

    /* 
    Remove organization._id from each blockedUser's organizationsBlockedBy
    field for organization.blockedUsers list.
    */
    for (const blockedUserId of organization.blockedUsers) {
      const blockedUser = await User.findOne({
        _id: blockedUserId,
      }).lean();

      await User.updateOne(
        {
          _id: blockedUser?._id,
        },
        {
          $set: {
            organizationsBlockedBy: blockedUser?.organizationsBlockedBy.filter(
              (organizationBlockedBy) =>
                organizationBlockedBy.toString() !== organization._id.toString()
            ),
          },
        }
      );
    }

    // Deletes the organzation.
    await Organization.deleteOne({
      _id: organization._id,
    });

    // Returns updated currentUser.
    return await User.findOne({
      _id: currentUser._id,
    })
      .select(["-password"])
      .lean();
  };
