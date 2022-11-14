import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { MembershipRequest, Organization, User } from "../../models";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
} from "../../../constants";
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
        IN_PRODUCTION !== true
          ? MEMBERSHIP_REQUEST_NOT_FOUND
          : requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_PARAM
      );
    }

    const organization = await Organization.findOne({
      _id: membershipRequest.organization,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    const user = await User.findOne({
      _id: membershipRequest.user,
    }).lean();

    // Checks whether user exists.
    if (!user) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    adminCheck(context.userId, organization);

    const userIsOrganizationMember = organization.members.some(
      (member) => member.toString() === user?._id.toString()
    );

    // Checks whether user is already a member of organization.
    if (userIsOrganizationMember === true) {
      throw new errors.ConflictError(
        IN_PRODUCTION !== true
          ? USER_ALREADY_MEMBER
          : requestContext.translate(USER_ALREADY_MEMBER_MESSAGE),
        USER_ALREADY_MEMBER_CODE,
        USER_ALREADY_MEMBER_PARAM
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
