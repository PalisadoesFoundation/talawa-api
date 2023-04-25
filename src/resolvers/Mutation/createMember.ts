import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import { adminCheck } from "../../utilities";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
} from "../../constants";
/**
 * This function enables to remove a member.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. Checks whether current user making the request is an admin of organization
 * 3. Checks whether curent user exists.
 * 4. Checks whether user with _id === args.data.userId is already an member of organization..
 * @returns Organization.
 */
export const createMember: MutationResolvers["createMember"] = async (
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
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether current user making the request is an admin of organization.
  await adminCheck(context.userId, organization!);

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

  // Checks whether curent user exists
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const userIsOrganizationMember = organization?.members.some(
    (member) => member.toString() === user._id.toString()
  );

  // Checks whether user with _id === args.data.userId is already an member of organization.
  if (userIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM
    );
  }

  // add user's id from members list on organization.
  organization = await Organization.findOneAndUpdate(
    {
      _id: organization?._id,
    },
    {
      $push: {
        members: args.data.userId,
      },
    },
    {
      new: true,
    }
  ).lean();

  // add organization's id from joinedOrganizations list on user.
  await User.findOneAndUpdate(
    {
      _id: args.data.userId,
    },
    {
      $push: {
        joinedOrganizations: organization?._id,
        members: organization?._id,
      },
    },
    {
      new: true,
    }
  )
    .select(["-password"])
    .lean();

  return organization!;
};
