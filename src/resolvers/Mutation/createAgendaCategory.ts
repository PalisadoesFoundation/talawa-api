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
 * This is a resolver function for the GraphQL mutation 'createAgendaCategory'.
 *
 * This resolver creates a new agenda category, associates it with an organization,
 * and updates the organization with the new agenda category.
 *
 * @returns A promise that resolves to the created agenda category.
 * @throws `NotFoundError` If the user or organization is not found.
 * @throws `UnauthorizedError` If the user does not have the required permissions.
 * @throws `InternalServerError` For other potential issues during agenda category creation.
 */

export const createAgendaCategory: MutationResolvers["createAgendaCategory"] =
  async (_parent, args, context) => {
    // Find the current user based on the provided createdBy ID or use the context userId

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

    // Checks whether the organization with _id === args.organizationId exists.
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
