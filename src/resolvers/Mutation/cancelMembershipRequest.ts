import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization, MembershipRequest } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
} from "../../constants";

export const cancelMembershipRequest: MutationResolvers["cancelMembershipRequest"] =
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

    const organization = await Organization.findOne({
      _id: membershipRequest.organization,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

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

    const currentUserCreatedMembershipRequest =
      currentUser._id.toString() === membershipRequest.user.toString();

    // Checks whether currentUser is the creator of membershipRequest.
    if (currentUserCreatedMembershipRequest === false) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
      );
    }

    // Deletes the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    // Removes membershipRequest._id from membershipRequests list on organization's document.
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $set: {
          membershipRequests: organization.membershipRequests.filter(
            (request) => request.toString() !== membershipRequest._id.toString()
          ),
        },
      }
    );

    // Removes membershipRequest._id from membershipRequests list on currentUser's document.
    await User.updateOne(
      {
        _id: currentUser._id,
      },
      {
        $set: {
          membershipRequests: currentUser.membershipRequests.filter(
            (request) => request.toString() !== membershipRequest._id.toString()
          ),
        },
      }
    );

    // Returns the deleted membershipRequest.
    return membershipRequest;
  };
