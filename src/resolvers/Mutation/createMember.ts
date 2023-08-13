import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Organization } from "../../models";
import { superAdminCheck } from "../../utilities";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  MEMBER_NOT_FOUND_ERROR,
} from "../../constants";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
/**
 * This function enables to add a member.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. Checks whether current user making the request is an superAdmin
 * 2. If the organization exists
 * 3. Checks whether curent user exists.
 * 4. Checks whether user with _id === args.input.userId is already an member of organization..
 * @returns Organization.
 */
export const createMember: MutationResolvers["createMember"] = async (
  _parent,
  args,
  context
) => {
  // Checks whether the current user is a superAdmin
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }
  superAdminCheck(currentUser);

  // Checks if organization exists.
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([args.input.organizationId]);
    
  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {

    organization = await Organization.findOne({
      _id: args.input.organizationId,
    }).lean();
    

    await cacheOrganizations([organization!])
  } 

  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const user = await User.findOne({
    _id: args.input.userId,
  }).lean();

  // Checks whether curent user exists
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const userIsOrganizationMember = organization?.members.some((member) =>
    member.equals(user._id)
  );

  // Checks whether user with _id === args.input.userId is already an member of organization.
  if (userIsOrganizationMember) {
    throw new errors.NotFoundError(
      requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
      MEMBER_NOT_FOUND_ERROR.CODE,
      MEMBER_NOT_FOUND_ERROR.PARAM
    );
  }

  // add organization's id from joinedOrganizations list on user.
  await User.updateOne(
    {
      _id: args.input.userId,
    },
    {
      $push: {
        joinedOrganizations: organization?._id,
      },
    },
    {
      new: true,
    }
  );

  // add user's id to members list on organization and return it.
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization?._id,
    },
    {
      $push: {
        members: args.input.userId,
      },
    },
    {
      new: true,
    }
  ).lean();

  await cacheOrganizations([updatedOrganization!])

  return updatedOrganization!;
};
