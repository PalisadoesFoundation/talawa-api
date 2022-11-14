import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { Organization, User } from "../../models";
/**
 * This function enables to unblock user.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists.
 * 2. If the user exists
 * 3. If the user is an admin of the organization
 * @returns updated organization.
 */
export const unblockUser: MutationResolvers["unblockUser"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.organizationId,
  }).lean();

  // checks if there exists an organization with _id === args.organizationId
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // ensure user exists
  const user = await User.findOne({
    _id: args.userId,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // checks if current user is an admin of the organization with _id === args.organizationId
  adminCheck(context.userId, organization);

  const userIsBlockedFromOrganization = organization.blockedUsers.some(
    (blockedUser) => blockedUser.toString() === user._id.toString()
  );

  // checks if user with _id === args.userId is blocked by organzation with _id == args.organizationId
  if (userIsBlockedFromOrganization === false) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // remove user from the blockedUsers list inside the organization record
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $set: {
        blockedUsers: organization.blockedUsers.filter(
          (blockedUser) => blockedUser !== user._id
        ),
      },
    }
  );

  // remove the organization from the organizationsBlockedBy array inside the user record
  return await User.findOneAndUpdate(
    {
      _id: user._id,
    },
    {
      $set: {
        organizationsBlockedBy: user.organizationsBlockedBy.filter(
          (organizationBlockedBy) => organizationBlockedBy !== organization._id
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
