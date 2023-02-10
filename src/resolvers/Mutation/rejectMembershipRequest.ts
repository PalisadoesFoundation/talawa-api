import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization, MembershipRequest } from "../../models";
import { adminCheck } from "../../utilities";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../constants";

export const rejectMembershipRequest: MutationResolvers["rejectMembershipRequest"] =
  async (_parent, args, context) => {
    const membershipRequest = await MembershipRequest.findOne({
      _id: args.membershipRequestId,
    }).lean();

    // Checks whether membershipRequest exists.
    if (!membershipRequest) {
      throw new errors.NotFoundError(
        requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_PARAM
      );
    }

    const organzation = await Organization.findOne({
      _id: membershipRequest.organization,
    }).lean();

    // Checks whether organization exists.
    if (!organzation) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
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
        requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    adminCheck(context.userId, organzation);

    // Deletes the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    // Removes membershipRequest._id from membershipRequests list of organization.
    await Organization.updateOne(
      {
        _id: organzation._id,
      },
      {
        $set: {
          membershipRequests: organzation.membershipRequests.filter(
            (request) => request.toString() !== membershipRequest._id.toString()
          ),
        },
      }
    );

    // Removes membershipRequest._id from membershipRequests list of user.
    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          membershipRequests: user.membershipRequests.filter(
            (request) => request.toString() !== membershipRequest._id.toString()
          ),
        },
      }
    );

    // Returns deleted membershipRequest.
    return membershipRequest;
  };
