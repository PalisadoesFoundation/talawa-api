import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, MembershipRequest, Organization } from "../../models";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { storeTransaction } from "../../utilities/storeTransaction";
/**
 * This function enables to send membership request.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the organization exists
 * 3. If the membership request already exists.
 * @returns Membership request.
 */
export const sendMembershipRequest: MutationResolvers["sendMembershipRequest"] =
  async (_parent, args, context) => {
    let organization;

    const organizationFoundInCache = await findOrganizationsInCache([
      args.organizationId,
    ]);

    organization = organizationFoundInCache[0];

    if (organizationFoundInCache[0] == null) {
      organization = await Organization.findOne({
        _id: args.organizationId,
      }).lean();

      if (organization !== null) {
        await cacheOrganizations([organization]);
      }
    }

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    const membershipRequestExists = await MembershipRequest.exists({
      user: context.userId,
      organization: organization._id,
    });

    if (membershipRequestExists === true) {
      throw new errors.ConflictError(
        requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM
      );
    }

    const createdMembershipRequest = await MembershipRequest.create({
      user: context.userId,
      organization: organization._id,
    });
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.CREATE,
      "MembershipRequest",
      `MembershipRequest:${createdMembershipRequest._id} created`
    );

    // add membership request to organization
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $push: {
          membershipRequests: createdMembershipRequest._id,
        },
      },
      {
        new: true,
      }
    ).lean();
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "Organization",
      `Organization:${organization._id} updated membershipRequests`
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    // add membership request to user
    await User.updateOne(
      {
        _id: context.userId,
      },
      {
        $push: {
          membershipRequests: createdMembershipRequest._id,
        },
      }
    );
    await storeTransaction(
      context.userId,
      TRANSACTION_LOG_TYPES.UPDATE,
      "User",
      `User:${context.userId} updated membershipRequests`
    );

    return createdMembershipRequest.toObject();
  };
