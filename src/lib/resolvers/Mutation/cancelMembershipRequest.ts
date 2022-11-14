import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User, Organization, MembershipRequest } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to cancel membership request.
 * @param _parent - parent of current request
 * @param args -  payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the membership request exists
 * 2. If the organization exists
 * 3. If the user exists
 * 4. If the user is the creator of the request
 * @returns Deleted membership request
 */
export const cancelMembershipRequest: MutationResolvers["cancelMembershipRequest"] =
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

    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const currentUserCreatedMembershipRequest =
      currentUser._id.toString() === membershipRequest.user.toString();

    // Checks whether currentUser is the creator of membershipRequest.
    if (currentUserCreatedMembershipRequest === false) {
      throw new errors.UnauthorizedError(
        IN_PRODUCTION !== true
          ? USER_NOT_AUTHORIZED
          : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
        USER_NOT_AUTHORIZED_CODE,
        USER_NOT_AUTHORIZED_PARAM
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
