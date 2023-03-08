import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import {
  IN_PRODUCTION,
  USER_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { Organization, User } from "../../models";

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
        ? ORGANIZATION_NOT_FOUND_ERROR.DESC
        : requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  // ensure user exists
  const user = await User.findOne({
    _id: args.userId,
  }).lean();

  if (!user) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND_ERROR.DESC
        : requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
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
        ? USER_NOT_AUTHORIZED_ERROR.DESC
        : requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
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
