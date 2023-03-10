import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import {
  USER_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_BLOCKING_SELF,
} from "../../constants";
import { Organization, User } from "../../models";

export const blockUser: MutationResolvers["blockUser"] = async (
  _parent,
  args,
  context
) => {
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

  const userExists = await User.exists({
    _id: args.userId,
  });

  // Checks whether user with _id === args.userId exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check whether the user - args.userId is a member of the organization before blocking
  const userIsOrganizationMember = organization?.members.some(
    (member) => member.toString() === args.userId.toString()
  );

  if (!userIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM
    );
  }

  if (args.userId === context.userId) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_BLOCKING_SELF.MESSAGE),
      USER_BLOCKING_SELF.CODE,
      USER_BLOCKING_SELF.PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organization.
  adminCheck(context.userId, organization);

  const userIsBlocked = organization.blockedUsers.some(
    (blockedUser) => blockedUser.toString() === args.userId.toString()
  );

  // Checks whether user with _id === args.userId is already blocked from organization.
  if (userIsBlocked === true) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Adds args.userId to blockedUsers list on organization's document.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $push: {
        blockedUsers: args.userId,
      },
    }
  );

  /*
  Adds organization._id to organizationsBlockedBy list on user's document
  with _id === args.userId and returns the updated user.
  */
  return await User.findOneAndUpdate(
    {
      _id: args.userId,
    },
    {
      $push: {
        organizationsBlockedBy: organization._id,
      },
    },
    {
      new: true,
    }
  )
    .select(["-password"])
    .lean();
};
