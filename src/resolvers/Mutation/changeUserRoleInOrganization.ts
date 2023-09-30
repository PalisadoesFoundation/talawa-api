import {
  CHAT_NOT_FOUND_ERROR,
  INVALID_ROLE_TYPE,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { InterfaceOrganization, Organization, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables a SUPERADMIN to change the role of a user in an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns Updated organization.
 */

export const changeUserRoleInOrganization: MutationResolvers["changeUserRoleInOrganization"] =
  async (_parent, args, context) => {
    // Check if args are valid
    if (args.role !== "ADMIN" && args.role !== "USER") {
      throw new errors.NotFoundError(
        requestContext.translate(INVALID_ROLE_TYPE.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM
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

    // Check if user is a member of the organization
    let isUserMember = false;
    organization.members.map((_id) => {
      if (_id == args.userId) {
        isUserMember = true;
        return;
      }
    });

    if (!isUserMember) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Check user role and update accordingly
    if (args.role === "ADMIN") {
      const updatedOrg = await Organization.updateOne(
        { _id: organization._id },
        { $push: { admins: args.userId } }
      );
      await User.updateOne(
        { _id: args.userId },
        { $push: { adminFor: args.organizationId } }
      );
      return { ...organization, ...updatedOrg };
    } else {
      const updatedOrg = await Organization.updateOne(
        { _id: organization._id },
        { $pull: { admins: args.userId } }
      ).lean();
      await User.updateOne(
        { _id: args.userId },
        { $pull: { adminFor: args.organizationId } }
      );
      return { ...organization, ...updatedOrg };
    }
  };
