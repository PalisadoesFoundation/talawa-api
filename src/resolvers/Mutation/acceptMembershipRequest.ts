import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import {
  adminCheck,
  getValidOrganizationById,
  getValidUserById,
} from "../../utilities";
import { MembershipRequest, Organization, User } from "../../models";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
} from "../../constants";
/**
 * This function accepts the membership request sent by a user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Whether the membership request exists or not.
 * 2. Whether thr organization exists or not
 * 3. Whether the user exists
 * 4. whether currentUser with _id === context.userId is an admin of organization.
 * 5. Whether user is already a member of organization.
 */
export const acceptMembershipRequest: MutationResolvers["acceptMembershipRequest"] =
  async (_parent, args, context) => {
    const membershipRequest = await MembershipRequest.findOne({
      _id: args.membershipRequestId,
    }).lean();

    // Checks whether membershipRequest exists.
    if (!membershipRequest) {
      throw new errors.NotFoundError(
        requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM
      );
    }

    const organization = await getValidOrganizationById(
      membershipRequest.organization
    );

    const user = await getValidUserById(membershipRequest.user);

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    const userIsOrganizationMember = organization.members.some(
      (member) => member.toString() === user?._id.toString()
    );

    // Checks whether user is already a member of organization.
    if (userIsOrganizationMember === true) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_MEMBER_ERROR.MESSAGE),
        USER_ALREADY_MEMBER_ERROR.CODE,
        USER_ALREADY_MEMBER_ERROR.PARAM
      );
    }

    // Delete the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    /*
   Add user._id to members list and remove membershipRequest._id
   from membershipRequests list on organization's document.
   */
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          members: user._id,
        },

        $set: {
          membershipRequests: organization.membershipRequests.filter(
            (request) => request.toString() !== membershipRequest._id.toString()
          ),
        },
      }
    );

    /*
   Add organization._id to joinedOrganizations list and remove 
   membershipRequest._id from membershipRequests list on user's document.
   */
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $push: {
          joinedOrganizations: organization._id,
        },

        $set: {
          membershipRequests: user.membershipRequests.filter(
            (request) => request.toString() !== membershipRequest._id.toString()
          ),
        },
      }
    );

    return membershipRequest;
  };
