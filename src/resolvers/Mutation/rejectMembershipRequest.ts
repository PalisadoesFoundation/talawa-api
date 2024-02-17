import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization, MembershipRequest } from "../../models";
import { adminCheck } from "../../utilities";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
/**
 * This function enables to reject membership request.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the membership request exists.
 * 2. If the organization exists.
 * 3. If the user to be rejected exists.
 * 4. If the user is the admin of the organization.
 * @returns Deleted membership request.
 */
export const rejectMembershipRequest: MutationResolvers["rejectMembershipRequest"] =
  async (_parent, args, context) => {
    const membershipRequest = await MembershipRequest.findOne({
      _id: args.membershipRequestId,
    })
      .populate("organization")
      .populate("user")
      .lean();

    // Checks whether membershipRequest exists.
    if (!membershipRequest) {
      throw new errors.NotFoundError(
        requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether organization exists.
    if (!membershipRequest.organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether user exists.
    if (!membershipRequest.user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, membershipRequest.organization);

    // Deletes the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    // Removes membershipRequest._id from membershipRequests list of organization.
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: membershipRequest.organization._id,
      },
      {
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      },
      {
        new: true,
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    // Removes membershipRequest._id from membershipRequests list of user.
    await User.updateOne(
      {
        _id: membershipRequest.user._id,
      },
      {
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      },
    );

    // Returns deleted membershipRequest.
    return membershipRequest;
  };
