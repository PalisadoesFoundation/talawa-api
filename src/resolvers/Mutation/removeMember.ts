import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import { adminCheck } from "../../utilities";
import {
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  MEMBER_NOT_FOUND_ERROR,
  USER_REMOVING_SELF,
  ADMIN_REMOVING_ADMIN,
  ADMIN_REMOVING_CREATOR,
} from "../../constants";

export const removeMember: MutationResolvers["removeMember"] = async (
  _parent,
  args,
  context
) => {
  let organization = await Organization.findOne({
    _id: args.data.organizationId,
  }).lean();

  // Checks if organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether current user making the request is an admin of organization.
  adminCheck(context.userId, organization!);

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

  // Checks whether curent user exists
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const userIsOrganizationMember = organization?.members.some(
    (member) => member.toString() === user._id.toString()
  );

  if (!userIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check if the current user is removing self
  if (user._id.toString() === currentUser?._id.toString()) {
    throw new errors.ConflictError(
      requestContext.translate(USER_REMOVING_SELF.message),
      USER_REMOVING_SELF.code,
      USER_REMOVING_SELF.param
    );
  }

  const userIsOrganizationAdmin = organization?.admins.some(
    (admin) => admin.toString() === user._id.toString()
  );

  /*
    userIsOrganizationAdmin being true implies that the current user is an admin of organization.
    If userIsOrganizationAdmin is true pushes error message to errors list and breaks out of loop.
    */
  if (userIsOrganizationAdmin === true) {
    throw new errors.ConflictError(
      requestContext.translate(ADMIN_REMOVING_ADMIN.message),
      ADMIN_REMOVING_ADMIN.code,
      ADMIN_REMOVING_ADMIN.param
    );
  }

  /*
    Administrators cannot remove creator of organzation from the members list.
    Following if block matches organization's creator's id to
    user's id. Match being true implies that current user is the creator
    of organization. If match is true assigns error message to errors list
    and breaks out of loop.
    */
  if (organization?.creator.toString() === user._id.toString()) {
    throw new errors.UnauthorizedError(
      requestContext.translate(ADMIN_REMOVING_CREATOR.message),
      ADMIN_REMOVING_CREATOR.code,
      ADMIN_REMOVING_CREATOR.param
    );
  }

  // Removes user's id from members list on organization.
  organization = await Organization.findOneAndUpdate(
    {
      _id: organization?._id,
    },
    {
      $set: {
        members: organization?.members.filter(
          (member) => member.toString() !== user._id.toString()
        ),
      },
    },
    {
      new: true,
    }
  ).lean();

  // Remove organization's id from joinedOrganizations list on user.
  await User.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        joinedOrganizations: user.joinedOrganizations.filter(
          (joinedOrganization) =>
            joinedOrganization.toString() !== organization?._id.toString()
        ),
      },
    }
  );

  return organization!;
};
