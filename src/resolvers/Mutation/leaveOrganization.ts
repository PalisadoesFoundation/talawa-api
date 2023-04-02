import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
/**
 * This function enables to leave an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the user exists
 * 3. If the user is the creator of the organization
 * 4. If the user is a member of the organization
 * @returns Updated user
 */
export const leaveOrganization: MutationResolvers["leaveOrganization"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.input.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserIsOrganizationMember = organization.members.some(
    (member) => member.toString() === currentUser!._id.toString()
  );

  // Checks whether currentUser is not a member of organzation.
  if (currentUserIsOrganizationMember === false) {
    throw new errors.ConflictError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Removes currentUser._id from admins and members lists of organzation's document.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $set: {
        admins: organization.admins.filter(
          (admin) => admin.toString() !== currentUser!._id.toString()
        ),
        members: organization.members.filter(
          (member) => member.toString() !== currentUser!._id.toString()
        ),
      },
    }
  );

  /*
  Removes organization._id from joinedOrganizations list of currentUser's document
  and returns the updated currentUser.
  */
  return await User.findOneAndUpdate(
    {
      _id: currentUser._id,
    },
    {
      $set: {
        joinedOrganizations: currentUser.joinedOrganizations.filter(
          (joinedOrganization) =>
            joinedOrganization.toString() !== organization._id.toString()
        ),
        adminFor: currentUser.adminFor.filter(
          (adminAtOrganization) =>
            adminAtOrganization.toString() !== organization._id.toString()
        ),
      },
    },
    {
      new: true,
    }
  )
    .select(["-password"])
    .lean();
};
