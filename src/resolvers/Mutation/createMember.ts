import mongoose from "mongoose";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Organization, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Adds a user as a member to an organization.
 *
 * This resolver performs the following actions:
 *
 * 1. Verifies if the current user making the request exists and is either a superAdmin or an admin of the organization.
 * 2. Checks if the specified organization exists in the cache; if not, fetches it from the database and caches it.
 * 3. Checks if the specified user exists and is not already a member of the organization.
 * 4. Adds the user to the organization's member list and updates the user's joinedOrganizations list.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `input`: An object containing:
 *     - `organizationId`: The ID of the organization to which the user will be added.
 *     - `userId`: The ID of the user to be added as a member.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns An object containing:
 *   - `organization`: The updated organization object.
 *   - `userErrors`: A list of errors encountered during the process.
 *
 * @remarks This function returns the updated organization and any errors encountered. It ensures that the user is not already a member before adding them and handles caching of the organization.
 */
export const createMember: MutationResolvers["createMember"] = async (
  _parent,
  args,
  context,
) => {
  // Checks whether the current user is a superAdmin
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  if (!currentUser) {
    // Return an error if the user is not found
    return {
      organization: new Organization(),
      userErrors: [
        {
          __typename: "UserNotFoundError",
          message: requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        },
      ],
    };
  }

  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }

  if (!currentUserAppProfile) {
    // Return an error if the user's app profile is not found
    return {
      organization: new Organization(),
      userErrors: [
        {
          __typename: "UserNotAuthorizedError",
          message: requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        },
      ],
    };
  }

  // Checks if organization exists.
  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.input.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.input.organizationId,
    }).lean();

    await cacheOrganizations([organization as InterfaceOrganization]);
  }

  if (!organization) {
    // Return an error if the organization is not found
    return {
      organization: new Organization(),
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

  const userIsOrganizationAdmin = organization.admins.some(
    (admin) =>
      admin === currentUser._id ||
      new mongoose.Types.ObjectId(admin.toString()).equals(currentUser._id),
  );
  if (!userIsOrganizationAdmin && !currentUserAppProfile.isSuperAdmin) {
    // Return an error if the user is not authorized
    return {
      organization: new Organization(),
      userErrors: [
        {
          __typename: "UserNotAuthorizedAdminError",
          message: requestContext.translate(USER_NOT_AUTHORIZED_ADMIN.MESSAGE),
        },
      ],
    };
  }

  const user = await User.findOne({
    _id: args.input.userId,
  }).lean();

  // Checks whether the user exists
  if (!user) {
    // Return an error if the user is not found
    return {
      organization: new Organization(),
      userErrors: [
        {
          __typename: "UserNotFoundError",
          message: requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        },
      ],
    };
  }

  const userIsOrganizationMember = organization?.members.some((member) =>
    member.equals(user._id),
  );

  // Checks whether the user is already a member of the organization
  if (userIsOrganizationMember) {
    // Return an error if the user is already a member
    return {
      organization: new Organization(),
      userErrors: [
        {
          __typename: "MemberNotFoundError",
          message: requestContext.translate(MEMBER_NOT_FOUND_ERROR.MESSAGE),
        },
      ],
    };
  }

  // Adds the organization ID to the user's joinedOrganizations list.
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
    },
  );

  // Adds the user's ID to the organization's members list and returns it.
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
    },
  ).lean();

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }

  return { organization: updatedOrganization, userErrors: [] };
};
