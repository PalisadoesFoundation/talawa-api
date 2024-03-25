import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { MembershipRequest, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
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
        requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM,
      );
    }

    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([
      membershipRequest.organization,
    ]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache.includes(null)) {
      organization = await Organization.findOne({
        _id: membershipRequest.organization,
      }).lean();
      if (organization) {
        await cacheOrganizations([organization]);
      }
    }

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
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
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentUserCreatedMembershipRequest = currentUser._id.equals(
      membershipRequest.user,
    );

    // Checks whether currentUser is the creator of membershipRequest.
    if (currentUserCreatedMembershipRequest === false) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Deletes the membershipRequest.
    await MembershipRequest.deleteOne({
      _id: membershipRequest._id,
    });

    // Removes membershipRequest._id from membershipRequests list on organization's document.
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: organization._id,
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

    // Removes membershipRequest._id from membershipRequests list on currentUser's document.
    await User.updateOne(
      {
        _id: currentUser._id,
      },
      {
        $pull: {
          membershipRequests: membershipRequest._id,
        },
      },
    );

    // Returns the deleted membershipRequest.
    return membershipRequest;
  };
