import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import {
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
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
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const userExists = await User.exists({
    _id: args.userId,
  });

  // Checks whether user with _id === args.userId exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
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
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
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
