import {
  IN_PRODUCTION,
  MEMBERSHIP_REQUEST_ALREADY_EXISTS,
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, MembershipRequest, Organization } from "../../models";

export const sendMembershipRequest: MutationResolvers["sendMembershipRequest"] =
  async (_parent, args, context) => {
    const currentUserExists = await User.exists({
      _id: context.userId,
    });

    if (currentUserExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    if (!organization) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    const membershipRequestExists = await MembershipRequest.exists({
      user: context.userId,
      organization: organization._id,
    });

    if (membershipRequestExists === true) {
      throw new errors.ConflictError(
        IN_PRODUCTION !== true
          ? MEMBERSHIP_REQUEST_ALREADY_EXISTS
          : requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE),
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.CODE,
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.PARAM
      );
    }

    const createdMembershipRequest = await MembershipRequest.create({
      user: context.userId,
      organization: organization._id,
    });

    // add membership request to organization
    await Organization.updateOne(
      {
        _id: organization._id,
      },
      {
        $push: {
          membershipRequests: createdMembershipRequest._id,
        },
      }
    );

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

    return createdMembershipRequest.toObject();
  };
