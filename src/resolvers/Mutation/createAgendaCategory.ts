import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import {
  AgendaCategoryModel,
  AppUserProfile,
  Organization,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";

/**
 * Creates a new agenda category and associates it with a specified organization.
 *
 * This resolver function performs the following steps:
 *
 * 1. Retrieves the current user based on the userId from the context.
 * 2. Fetches the associated app user profile for the current user.
 * 3. Retrieves the organization specified in the input, either from the cache or from the database.
 * 4. Validates the existence of the organization.
 * 5. Checks if the current user is authorized to perform this operation.
 * 6. Creates a new agenda category and associates it with the specified organization.
 * 7. Updates the organization document with the new agenda category.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the request, including:
 *   - `input`: An object containing:
 *     - `organizationId`: The ID of the organization to which the new agenda category will be added.
 *     - `name`: The name of the new agenda category.
 *     - `description`: A description of the new agenda category.
 * @param context - The context of the entire application, including user information (context.userId).
 *
 * @returns A promise that resolves to the created agenda category object.
 *
 * @remarks The function performs caching and retrieval operations to ensure the latest data is used,
 * and it updates the organization document to include the new agenda category.
 */
export const createAgendaCategory: MutationResolvers["createAgendaCategory"] =
  async (_parent, args, context) => {
    // Find the current user based on the provided userId from the context
    const userId = context.userId;

    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    let currentAppUserProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentAppUserProfile = appUserProfileFoundInCache[0];
    if (currentAppUserProfile === null) {
      currentAppUserProfile = await AppUserProfile.findOne({
        _id: currentUser.appUserProfileId,
      }).lean();
      if (currentAppUserProfile !== null) {
        await cacheAppUserProfile([currentAppUserProfile]);
      }
    }
    if (!currentAppUserProfile) {
      throw new errors.UnauthenticatedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    const organizationFoundInCache = await findOrganizationsInCache([
      args.input.organizationId,
    ]);

    const organization =
      organizationFoundInCache[0] ||
      (await Organization.findOne({
        _id: args.input.organizationId,
      }).lean());

    if (organizationFoundInCache[0] == null && organization) {
      await cacheOrganizations([organization]);
    }

    // Checks whether the organization with _id === args.input.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks whether the user is authorized to perform the operation
    await adminCheck(context.userId, organization);

    // Create a new AgendaCategory using the Mongoose model
    const createdAgendaCategory = await AgendaCategoryModel.create({
      ...args.input,
      createdBy: currentUser?._id,
      createdAt: new Date(),
    });

    // Update the organization's document to include the new agenda category
    await Organization.findByIdAndUpdate(
      organization._id,
      {
        $push: {
          agendaCategories: createdAgendaCategory,
        },
      },
      { new: true },
    );
    return createdAgendaCategory.toObject();
  };
