import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
import type { InterfaceOrganization } from "../../models";
import { User, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_ORGANIZATION_ADMIN,
} from "../../constants";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { Types } from "mongoose";
/**
 * This function enables to remove an admin.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists.
 * 3. If the user to be removed is an admin.
 * 4. If the user removing the admin is the creator of the organization
 * @returns Updated user.
 */
export const removeAdmin: MutationResolvers["removeAdmin"] = async (
  _parent,
  args,
  context
) => {
  let organization: InterfaceOrganization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  if (organizationFoundInCache[0] === null) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    }).lean();

    if (organization !== null) await cacheOrganizations([organization]);
  } else {
    organization = organizationFoundInCache[0];
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  const user = await User.findOne({
    _id: args.data.userId,
  }).lean();

  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether user exists.
  if (!user) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Checks whether user is an admin of the organization.
  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    Types.ObjectId(admin).equals(user._id)
  );

  if (!userIsOrganizationAdmin) {
    throw new errors.UnauthorizedError(
      requestContext.translate(`${USER_NOT_ORGANIZATION_ADMIN.MESSAGE}`),
      USER_NOT_ORGANIZATION_ADMIN.CODE,
      USER_NOT_ORGANIZATION_ADMIN.PARAM
    );
  }

  // Checks whether the current user is a superadmin.
  if (currentUser) superAdminCheck(currentUser);

  // Removes user._id from admins list of the organization.
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $set: {
        admins: organization.admins.filter(
          (admin) => admin.toString() !== user._id.toString()
        ),
      },
    },
    {
      new: true,
    }
  );

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }

  // Removes organization._id from adminFor list of the user and returns the updated user.
  return await User.findOneAndUpdate(
    {
      _id: user._id,
    },
    {
      $set: {
        adminFor: user.adminFor.filter(
          (adminForOrganization) =>
            adminForOrganization.toString() !== organization._id.toString()
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
