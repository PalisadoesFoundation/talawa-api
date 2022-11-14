import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import { creatorCheck } from "../../utilities";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_MEMBER_NOT_FOUND,
  ORGANIZATION_MEMBER_NOT_FOUND_CODE,
  ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE,
  ORGANIZATION_MEMBER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../../constants";
/**
 * This function enables to create an admin for an organization.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the current user is the creator of the organization
 * 3. If the user exists
 * 4. If the user is a member of the organization
 * 4. If the user is already an admin of the organization
 * @returns Updated user
 */
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
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
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
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
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
      IN_PRODUCTION !== true
        ? ORGANIZATION_MEMBER_NOT_FOUND
        : requestContext.translate(ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE),
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
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
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
