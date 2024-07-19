import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { MembershipRequest, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Mutation resolver function to cancel a membership request.
 *
 * This function performs the following actions:
 * 1. Verifies that the membership request specified by `args.membershipRequestId` exists.
 * 2. Ensures that the organization associated with the membership request exists.
 * 3. Confirms that the user specified by `context.userId` exists.
 * 4. Checks if the current user is the creator of the membership request.
 * 5. Deletes the membership request.
 * 6. Updates the organization document to remove the membership request from its `membershipRequests` list.
 * 7. Updates the user's document to remove the membership request from their `membershipRequests` list.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `membershipRequestId`: The ID of the membership request to be canceled.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the deleted membership request.
 *
 * @see MembershipRequest - The MembershipRequest model used to interact with the membership requests collection in the database.
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see User - The User model used to interact with the users collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see findOrganizationsInCache - Service function to retrieve organizations from cache.
 * @see cacheOrganizations - Service function to cache updated organization data.
 * @see findUserInCache - Service function to retrieve users from cache.
 * @see cacheUsers - Service function to cache updated user data.
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

    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

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
