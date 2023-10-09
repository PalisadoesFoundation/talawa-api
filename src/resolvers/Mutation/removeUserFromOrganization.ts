import { Types } from "mongoose";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
  USER_TO_BE_REMOVED_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization } from "../../models";
import { Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables a SUPERADMIN to remove a user/admin from organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user is the admin of the organization.
 * 3. If the user to be removed is a member of the organization.
 * @returns Updated organization.
 */

export const removeUserFromOrganization: MutationResolvers["removeUserFromOrganization"] =
  async (_parent, args, context) => {
    let organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    // Checks whether organization exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }
    // Check wheter user to be removed exists.
    const user = await User.findOne({ _id: args.userId });

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_TO_BE_REMOVED_NOT_FOUND_ERROR.MESSAGE),
        USER_TO_BE_REMOVED_NOT_FOUND_ERROR.CODE,
        USER_TO_BE_REMOVED_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether user to be removed is a member of the organization.
    const userIsOrganizationMember = organization?.members.some(
      (member) =>
        member === args.userId || Types.ObjectId(member).equals(args.userId)
    );

    if (!userIsOrganizationMember) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
        USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
        USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM
      );
    }
    // Check whether the logged in user is a super admin by userType
    const loggedInUser = await User.findOne({ _id: context.userId }).lean();
    if (!loggedInUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check whether current user is admin of the organization.
    const currentUserIsOrganizationAdmin = organization?.admins.some(
      (admin) =>
        admin === context.userId || Types.ObjectId(admin).equals(context.userId)
    );

    if (
      !currentUserIsOrganizationAdmin &&
      loggedInUser.userType !== "SUPERADMIN"
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        USER_NOT_AUTHORIZED_ADMIN.CODE,
        USER_NOT_AUTHORIZED_ADMIN.PARAM
      );
    }

    await User.findOneAndUpdate(
      { _id: args.userId },
      {
        $pull: {
          joinedOrganizations: args.organizationId,
          adminFor: args.organizationId,
          organizationsBlockedBy: args.organizationId,
        },
      }
    ).lean();

    organization = await Organization.findOneAndUpdate(
      { _id: organization._id },
      { $pull: { members: args.userId, admins: args.userId } }
    ).lean();

    return organization ?? ({} as InterfaceOrganization);
  };
