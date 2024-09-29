import mongoose from "mongoose";
import {
  ORGANIZATION_MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { requestContext } from "../../libraries";
import type {
  InterfaceOrganization,
  InterfaceAppUserProfile,
} from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";

/**
 * Creates an admin for an organization by adding the specified user to the organization's admin list.
 *
 * This function performs several checks:
 *
 * 1. Verifies if the specified organization exists.
 * 2. Ensures the current user is found and has an associated app user profile.
 * 3. Checks if the current user is the creator of the organization.
 * 4. Checks if the specified user exists and is a member of the organization.
 * 5. Ensures the specified user is not already an admin of the organization.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `data`: An object containing:
 *     - `organizationId`: The ID of the organization to which the user will be added as an admin.
 *     - `userId`: The ID of the user to be made an admin.
 * @param context - The context of the entire application, including user information and other context-specific data.
 *
 * @returns An object containing:
 *   - `user`: The updated app user profile of the user being added as an admin.
 *   - `userErrors`: An array of error objects if any errors occurred, otherwise an empty array.
 *
 * @remarks The function handles the following:
 * - Caches and retrieves the organization data.
 * - Verifies the existence and profile of the current user.
 * - Ensures the user to be added is a member of the organization and is not already an admin.
 * - Updates the organization's admin list and the app user profile of the newly added admin.
 */
export const createAdmin: MutationResolvers["createAdmin"] = async (
  _parent,
  args,
  context,
) => {
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    }).lean();

    await cacheOrganizations([organization as InterfaceOrganization]);
  }

  // Checks whether the organization exists.
  if (!organization) {
    return {
      user: new AppUserProfile(),
      userErrors: [
        {
          __typename: "OrganizationNotFoundError",
          message: requestContext.translate(
            ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
          ),
        },
      ],
    };
  }

  // Checks whether the current user exists and has an app user profile.
  const currentUser = await User.findById({
    _id: context.userId,
  });

  if (!currentUser) {
    return {
      user: new AppUserProfile(),
      userErrors: [
        {
          __typename: "UserNotFoundError",
          message: requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        },
      ],
    };
  }

  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();

  if (!currentUserAppProfile) {
    return {
      user: new AppUserProfile(),
      userErrors: [
        {
          __typename: "UserNotAuthorizedError",
          message: requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        },
      ],
    };
  }

  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

  const userAppProfile = await AppUserProfile.findOne({
    userId: args.data.userId,
  }).lean();

  if (!userAppProfile) {
    return {
      user: new AppUserProfile(),
      userErrors: [
        {
          __typename: "UserNotFoundError",
          message: requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        },
      ],
    };
  }

  // Checks if the user is a member of the organization.
  const userIsOrganizationMember = organization.members.some((member) =>
    new mongoose.Types.ObjectId(member.toString()).equals(args.data.userId),
  );

  if (userIsOrganizationMember === false) {
    return {
      user: new AppUserProfile(),
      userErrors: [
        {
          __typename: "OrganizationMemberNotFoundError",
          message: requestContext.translate(
            ORGANIZATION_MEMBER_NOT_FOUND_ERROR.MESSAGE,
          ),
        },
      ],
    };
  }

  // Checks if the user is already an admin of the organization.
  const userIsOrganizationAdmin = organization.admins.some((admin) =>
    new mongoose.Types.ObjectId(admin.toString()).equals(args.data.userId),
  );

  if (userIsOrganizationAdmin === true) {
    return {
      user: new AppUserProfile(),
      userErrors: [
        {
          __typename: "UserNotAuthorizedError",
          message: requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        },
      ],
    };
  }

  // Updates the organization document to add the user as an admin.
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: organization._id,
    },
    {
      $push: {
        admins: args.data.userId,
      },
    },
    {
      new: true,
    },
  );

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }

  // Updates the app user profile to reflect the new admin role.
  return {
    user: await AppUserProfile.findOneAndUpdate(
      {
        _id: userAppProfile._id,
      },
      {
        $push: {
          adminFor: organization._id,
        },
      },
      {
        new: true,
      },
    )
      .select(["-password"])
      .lean(),
    userErrors: [],
  };
};
