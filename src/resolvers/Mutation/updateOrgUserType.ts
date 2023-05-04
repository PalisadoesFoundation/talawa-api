import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  ADMIN_CANT_CHANGE_OWN_ROLE,
  USER_NOT_AUTHORIZED_ADMIN,
  ORGANIZATION_NOT_FOUND_ERROR,
  ORGANIZATION_MEMBER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";

/**
 * This function enables to update user type.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * @returns Updated user type.
 */
export const updateOrgUserType: MutationResolvers["updateOrgUserType"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  })
    .select(["userType"])
    .lean();

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }
  const organization = await Organization.findOne({
    _id: args.data.organizationId!,
  }).lean();

  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  if (!adminCheck(context.userId, organization)) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
      USER_NOT_AUTHORIZED_ADMIN.CODE,
      USER_NOT_AUTHORIZED_ADMIN.PARAM
    );
  }

  if (args.data.id === currentUser._id.toString()) {
    throw new errors.InputValidationError(
      requestContext.translate(ADMIN_CANT_CHANGE_OWN_ROLE.MESSAGE),
      ADMIN_CANT_CHANGE_OWN_ROLE.CODE,
      ADMIN_CANT_CHANGE_OWN_ROLE.PARAM
    );
  }

  const userExists = await User.exists({
    _id: args.data.id!,
  });

  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const userIsOrganizationMember = organization.members.some((member) =>
    member.equals(args.data.id!)
  );

  // Checks whether user with _id === args.data.id is not a member of organization.
  if (userIsOrganizationMember === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_MEMBER_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_MEMBER_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_MEMBER_NOT_FOUND_ERROR.PARAM
    );
  }

  await User.updateOne(
    {
      _id: args.data.id!,
    },
    {
      userType: args.data.userType!,
      adminApproved: true,
    }
  );

  return true;
};
