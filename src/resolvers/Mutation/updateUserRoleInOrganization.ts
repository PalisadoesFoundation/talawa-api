import { Types } from "mongoose";
import {
  ADMIN_CANNOT_CHANGE_ITS_ROLE,
  ADMIN_CHANGING_ROLE_OF_CREATOR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { storeTransaction } from "../../utilities/storeTransaction";

/**
 * This function enables a SUPERADMIN to change the role of a user in an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns Updated organization.
 * Only SUPERADMIN & ADMIN of a organization can update the role of a user in an organization.
 */

export const updateUserRoleInOrganization: MutationResolvers["updateUserRoleInOrganization"] =
  async (_parent, args, context) => {
    // Check if organization exists
    const organization = await Organization.findOne({
      _id: args.organizationId,
    }).lean();

    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check if user exists
    const user = await User.findOne({ _id: args.userId }).lean();

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether user to be removed is a member of the organization.
    const userIsOrganizationMember = organization?.members.some((member) =>
      Types.ObjectId(member).equals(user._id)
    );

    if (!userIsOrganizationMember) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
        USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
        USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM
      );
    }

    // Check whether the logged in user exists
    const loggedInUser = await User.findOne({ _id: context.userId }).lean();
    if (!loggedInUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check whether loggedIn user is admin of the organization.
    const loggedInUserIsOrganizationAdmin = organization?.admins.some((admin) =>
      Types.ObjectId(admin).equals(loggedInUser._id)
    );

    if (
      !loggedInUserIsOrganizationAdmin &&
      loggedInUser.userType !== "SUPERADMIN"
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        USER_NOT_AUTHORIZED_ADMIN.CODE,
        USER_NOT_AUTHORIZED_ADMIN.PARAM
      );
    }
    // Admin of Org cannot change the role of SUPERADMIN in an organization.
    if (
      args.role === "SUPERADMIN" &&
      loggedInUser.userType !== "SUPERADMIN" &&
      loggedInUserIsOrganizationAdmin
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        USER_NOT_AUTHORIZED_ADMIN.CODE,
        USER_NOT_AUTHORIZED_ADMIN.PARAM
      );
    }
    // ADMIN cannot change the role of itself
    if (
      Types.ObjectId(context?.userId).equals(user._id) &&
      loggedInUserIsOrganizationAdmin
    ) {
      throw new errors.ConflictError(
        requestContext.translate(ADMIN_CANNOT_CHANGE_ITS_ROLE.MESSAGE),
        ADMIN_CANNOT_CHANGE_ITS_ROLE.CODE,
        ADMIN_CANNOT_CHANGE_ITS_ROLE.PARAM
      );
    }

    // ADMIN cannot change the role of the creator of the organization.
    if (Types.ObjectId(organization?.creator).equals(user._id)) {
      throw new errors.UnauthorizedError(
        requestContext.translate(ADMIN_CHANGING_ROLE_OF_CREATOR.MESSAGE),
        ADMIN_CHANGING_ROLE_OF_CREATOR.CODE,
        ADMIN_CHANGING_ROLE_OF_CREATOR.PARAM
      );
    }

    // Check user role and update accordingly
    if (args.role === "ADMIN") {
      const updatedOrg = await Organization.updateOne(
        { _id: args.organizationId },
        { $push: { admins: args.userId } }
      );
      await User.updateOne(
        { _id: args.userId },
        { $push: { adminFor: args.organizationId } }
      );
      storeTransaction(
        context.userId,
        TRANSACTION_LOG_TYPES.UPDATE,
        "Organization",
        `Organization:${args.organizationId} updated admins`
      );
      storeTransaction(
        context.userId,
        TRANSACTION_LOG_TYPES.UPDATE,
        "User",
        `User:${args.userId} updated adminFor`
      );
      return { ...organization, ...updatedOrg };
    } else {
      const updatedOrg = await Organization.updateOne(
        { _id: args.organizationId },
        { $pull: { admins: args.userId } }
      ).lean();
      storeTransaction(
        context.userId,
        TRANSACTION_LOG_TYPES.UPDATE,
        "Organization",
        `Organization:${args.organizationId} updated admins`
      );
      await User.updateOne(
        { _id: args.userId },
        { $pull: { adminFor: args.organizationId } }
      );
      storeTransaction(
        context.userId,
        TRANSACTION_LOG_TYPES.UPDATE,
        "User",
        `User:${args.userId} updated adminFor`
      );
      return { ...organization, ...updatedOrg };
    }
  };
