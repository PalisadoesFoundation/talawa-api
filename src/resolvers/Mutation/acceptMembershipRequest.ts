import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import type { Types } from "mongoose";
import { MembershipRequest, Organization, User } from "../../models";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
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
      _id: args.input.membershipRequestId,
    })
      .populate(["organization", "user"])
      .exec();

    // Checks whether membershipRequest exists.
    if (!membershipRequest) {
      return {
        data: null,
        errors: [
          {
            __typename: "MembershipRequestNotFoundError",
            message: MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE,
            path: [MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM],
          },
        ],
      };
    }

    const organization = membershipRequest.organization;

    // Checks whether organization exists.
    if (!organization) {
      return {
        data: null,
        errors: [
          {
            __typename: "OrganizationNotFoundError",
            message: ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
            path: [ORGANIZATION_NOT_FOUND_ERROR.PARAM],
          },
        ],
      };
    }

    const user = membershipRequest.user;

    // Checks whether user exists.
    if (!user) {
      return {
        data: null,
        errors: [
          {
            __typename: "UserNotFoundError",
            message: USER_NOT_FOUND_ERROR.MESSAGE,
            path: [USER_NOT_FOUND_ERROR.PARAM],
          },
        ],
      };
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    const userIsOrganizationMember = organization.members.some(
      (member: Types.ObjectId) => member.equals(user?._id)
    );

    // Checks whether user is already a member of organization.
    if (userIsOrganizationMember === true) {
      return {
        data: null,
        errors: [
          {
            __typename: "UserAlreadyMemberError",
            message: USER_ALREADY_MEMBER_ERROR.MESSAGE,
            path: [USER_ALREADY_MEMBER_ERROR.PARAM],
          },
        ],
      };
    }

    // Delete the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    // Update the organization
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          members: user._id,
        },
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      }
    );

    // Update the user
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $push: {
          joinedOrganizations: organization._id,
        },
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      }
    );

    return {
      data: membershipRequest,
      errors: [],
    };
  };
