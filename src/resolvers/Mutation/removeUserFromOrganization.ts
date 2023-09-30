import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
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
    const organization = await Organization.findOne({
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

    const user = await User.findOne({ _id: args.userId });

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether user to be removed is a member of the organization.
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
    // Removes joined organization, admin for and blocked organization from user.
    await User.updateOne(
      { _id: args.userId },
      {
        $pull: {
          joinedOrganizations: args.organizationId,
          adminFor: args.organizationId,
          organizationsBlockedBy: args.organizationId,
        },
      }
    );
    // Removes user from organization.
    const updatedOrg = await Organization.updateOne(
      { _id: organization._id },
      { $pull: { members: args.userId, admins: args.userId } }
    );

    return { ...organization, ...updatedOrg };
  };
