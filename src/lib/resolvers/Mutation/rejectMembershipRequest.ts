import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Organization, MembershipRequest } from "../../models";
import { adminCheck } from "../../utilities";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../constants";
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

    const organzation = await Organization.findOne({
      _id: membershipRequest.organization,
    }).lean();

    // Checks whether organization exists.
    if (!organzation) {
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
