import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import { creatorCheck } from "../../utilities";
import {
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_MEMBER_NOT_FOUND_CODE,
  ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE,
  ORGANIZATION_MEMBER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../constants";

export const createAdmin: MutationResolvers["createAdmin"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.data.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is the creator of organization.
  creatorCheck(context.userId, organization);

  const userExists = await User.exists({
    _id: args.data.userId,
  });

  // Checks whether user with _id === args.data.userId exists.
  if (userExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const userIsOrganizationMember = organization.members.some(
    (member) => member.toString() === args.data.userId.toString()
  );

  // Checks whether user with _id === args.data.userId is not a member of organization.
  if (userIsOrganizationMember === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE),
      ORGANIZATION_MEMBER_NOT_FOUND_CODE,
      ORGANIZATION_MEMBER_NOT_FOUND_PARAM
    );
  }

  const userIsOrganizationAdmin = organization.admins.some(
    (admin) => admin.toString() === args.data.userId.toString()
  );

  // Checks whether user with _id === args.data.userId is already an admin of organization.
  if (userIsOrganizationAdmin === true) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Adds args.data.userId to admins list of organization's document.
  await Organization.updateOne(
    {
      _id: organization._id,
    },
    {
      $push: {
        admins: args.data.userId,
      },
    }
  );

  /*
  Adds organization._id to adminFor list on user's document with _id === args.data.userId
  and returns the updated user.
  */
  return await User.findOneAndUpdate(
    {
      _id: args.data.userId,
    },
    {
      $push: {
        adminFor: organization._id,
      },
    },
    {
      new: true,
    }
  )
    .select(["-password"])
    .lean();
};
