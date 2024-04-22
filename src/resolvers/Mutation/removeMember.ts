import mongoose from "mongoose";
import {
  ADMIN_REMOVING_ADMIN,
  ADMIN_REMOVING_CREATOR,
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_REMOVING_SELF,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceOrganization } from "../../models";
import { Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
/**
 * This function enables to remove a member.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user to be removed exists.
 * 3. If the user is the admin of the organization.
 * 4. If the user to be removed is a member of the organization.
 * @returns Organization.
 */
export const removeMember: MutationResolvers["removeMember"] = async (
  _parent,
  args,
  context,
) => {
  let organization: InterfaceOrganization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  if (organizationFoundInCache[0] == null) {
    organization = (await Organization.findOne({
      _id: args.data.organizationId,
    }).lean()) as InterfaceOrganization;
    if (organization) await cacheOrganizations([organization]);
  } else {
    organization = organizationFoundInCache[0];
  }

  // Checks if organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether current user making the request is an admin of organization.
  await adminCheck(context.userId, organization);

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

  // Checks whether curent user exists
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const userIsOrganizationMember = organization?.members.some((member) =>
    new mongoose.Types.ObjectId(member.toString()).equals(user._id),
  );

  if (!userIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the current user is removing self
  if (user._id.equals(currentUser?._id)) {
    throw new errors.ConflictError(
      requestContext.translate(USER_REMOVING_SELF.MESSAGE),
      USER_REMOVING_SELF.CODE,
      USER_REMOVING_SELF.PARAM,
    );
  }

  const userIsOrganizationAdmin = organization?.admins.some((admin) =>
    new mongoose.Types.ObjectId(admin.toString()).equals(user._id),
  );

  /*
    userIsOrganizationAdmin being true implies that the current user is an admin of organization.
    If userIsOrganizationAdmin is true pushes error message to errors list and breaks out of loop.
    */
  if (userIsOrganizationAdmin === true) {
    throw new errors.ConflictError(
      requestContext.translate(ADMIN_REMOVING_ADMIN.MESSAGE),
      ADMIN_REMOVING_ADMIN.CODE,
      ADMIN_REMOVING_ADMIN.PARAM,
    );
  }

  /*
    Administrators cannot remove creator of organzation from the members list.
    Following if block matches organization's creator's id to
    user's id. Match being true implies that current user is the creator
    of organization. If match is true assigns error message to errors list
    and breaks out of loop.
    */
  if (
    new mongoose.Types.ObjectId(organization?.creatorId.toString()).equals(
      user._id,
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(ADMIN_REMOVING_CREATOR.MESSAGE),
      ADMIN_REMOVING_CREATOR.CODE,
      ADMIN_REMOVING_CREATOR.PARAM,
    );
  }

  // Removes user's id from members list on organization.
  organization = (await Organization.findOneAndUpdate(
    {
      _id: organization?._id,
    },
    {
      $set: {
        members: organization?.members.filter(
          (member) => member.toString() !== user._id.toString(),
        ),
      },
    },
    {
      new: true,
    },
  ).lean()) as InterfaceOrganization;
  if (organization) await cacheOrganizations([organization]);

  // Remove organization's id from joinedOrganizations list on user.
  await User.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        joinedOrganizations: user.joinedOrganizations.filter(
          (joinedOrganization) =>
            joinedOrganization.toString() !== organization?._id.toString(),
        ),
      },
    },
  );

  return organization ?? ({} as InterfaceOrganization);
};
