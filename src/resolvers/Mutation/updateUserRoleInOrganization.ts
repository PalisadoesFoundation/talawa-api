import mongoose from "mongoose";
import {
  ADMIN_CANNOT_CHANGE_ITS_ROLE,
  ADMIN_CHANGING_ROLE_OF_CREATOR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext, logger } from "../../libraries";
import {
  AppUserProfile,
  Organization,
  RoleAuditLogs,
  User,
} from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { mailer } from "../../utilities";

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
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Check if user exists
    const user = await User.findOne({ _id: args.userId }).lean();

    if (!user) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether user to be removed is a member of the organization.
    const userIsOrganizationMember = organization?.members.some((member) =>
      new mongoose.Types.ObjectId(member.toString()).equals(user._id),
    );

    if (!userIsOrganizationMember) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
        USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
        USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
      );
    }

    // Check whether the logged in user exists
    const loggedInUser = await User.findOne({ _id: context.userId }).lean();
    if (!loggedInUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const loggedInUserAppProfile = await AppUserProfile.findOne({
      userId: loggedInUser._id,
    }).lean();
    if (!loggedInUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    // Check whether loggedIn user is admin of the organization.
    const loggedInUserIsOrganizationAdmin = organization?.admins.some((admin) =>
      new mongoose.Types.ObjectId(admin.toString()).equals(loggedInUser._id),
    );

    if (
      !loggedInUserIsOrganizationAdmin &&
      loggedInUserAppProfile.isSuperAdmin === false
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        USER_NOT_AUTHORIZED_ADMIN.CODE,
        USER_NOT_AUTHORIZED_ADMIN.PARAM,
      );
    }
    // Admin of Org cannot change the role of SUPERADMIN in an organization.
    if (
      args.role === "SUPERADMIN" &&
      !loggedInUserAppProfile.isSuperAdmin &&
      loggedInUserIsOrganizationAdmin
    ) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        USER_NOT_AUTHORIZED_ADMIN.CODE,
        USER_NOT_AUTHORIZED_ADMIN.PARAM,
      );
    }
    // ADMIN cannot change the role of itself
    if (
      new mongoose.Types.ObjectId(context?.userId.toString()).equals(
        user._id,
      ) &&
      loggedInUserIsOrganizationAdmin
    ) {
      throw new errors.ConflictError(
        requestContext.translate(ADMIN_CANNOT_CHANGE_ITS_ROLE.MESSAGE),
        ADMIN_CANNOT_CHANGE_ITS_ROLE.CODE,
        ADMIN_CANNOT_CHANGE_ITS_ROLE.PARAM,
      );
    }

    // ADMIN cannot change the role of the creator of the organization.
    if (
      new mongoose.Types.ObjectId(organization?.creatorId.toString()).equals(
        user._id,
      )
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(ADMIN_CHANGING_ROLE_OF_CREATOR.MESSAGE),
        ADMIN_CHANGING_ROLE_OF_CREATOR.CODE,
        ADMIN_CHANGING_ROLE_OF_CREATOR.PARAM,
      );
    }

    const updateOperation = args.role === "ADMIN" ? "$push" : "$pull";
    const updateAction = args.role === "ADMIN" ? "GRANTED" : "REMOVED";

    const updatedOrg = await Organization.updateOne(
      { _id: args.organizationId },
      {
        [updateOperation]: { admins: args.userId },
      },
    );
    await AppUserProfile.updateOne(
      { userId: args.userId },
      { [updateOperation]: { adminFor: args.organizationId } },
    );

    await RoleAuditLogs.create({
      roleEditorUserId: context.userId,
      affectedUserId: args.userId,
      organizationId: args.organizationId,
      description: `User ${user.firstName} was ${updateAction} ADMIN role in organization ${organization.name}`,
    });

    const previousRoleText = args.role === "ADMIN" ? "USER" : "ADMIN";
    const newRoleText = args.role;

    const roleChangeVisual = `<span style="text-decoration: line-through; color: red;">${previousRoleText}</span> 
                              <span style="font-size: 18px; color: black;"> → </span> 
                              <span style="color: green;">${newRoleText}</span>`;

    const emailSubject = "Role Update Notification";
    const emailBody = `<h2>Hi ${user.firstName},</h2>
                      <p>Your role in the organization <strong>${organization.name}</strong> has been updated as follows:</p>
                      <p><strong>Role Change:</strong> ${roleChangeVisual}</p>
                      <br><br>
                      <small>This is an automated notification, please do not reply.</small>`;

    mailer({
      emailTo: user.email,
      subject: emailSubject,
      body: emailBody,
    }).then((info) => {
      logger.info(`Role update email sent successfully: ${info}`);
    });

    return { ...organization, ...updatedOrg };
  };
