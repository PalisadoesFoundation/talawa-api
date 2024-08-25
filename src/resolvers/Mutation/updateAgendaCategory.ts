import {
  AGENDA_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAgendaCategory,
  InterfaceAppUserProfile,
  InterfaceUser,
} from "../../models";
import { AgendaCategoryModel, AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type {
  MutationResolvers,
  UpdateAgendaCategoryInput,
} from "../../types/generatedGraphQLTypes";
/**
 * This is a resolver function for the GraphQL mutation 'updateAgendaCategory'.
 *
 * This resolver updates an existing agenda category based on the provided ID.
 * It checks if the user has the necessary permissions to update the agenda category.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args  - The input arguments for the mutation.
 * @param context - The context object containing user information.
 * @returns A promise that resolves to the updated agenda category.
 * @throws `NotFoundError` If the agenda category or user is not found.
 * @throws `UnauthorizedError` If the user does not have the required permissions.
 * @throws `InternalServerError` For other potential issues during agenda category update.
 */

export const updateAgendaCategory: MutationResolvers["updateAgendaCategory"] =
  async (_parent, args, context) => {
    // Check if the AgendaCategory exists
    // Fetch the user to get the organization ID

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

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
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
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    const existingAgendaCategory = await AgendaCategoryModel.findById(
      args.id,
    ).lean();

    // If the AgendaCategory is not found, throw a NotFoundError
    if (!existingAgendaCategory) {
      throw new errors.NotFoundError(
        requestContext.translate(AGENDA_CATEGORY_NOT_FOUND_ERROR.MESSAGE),
        AGENDA_CATEGORY_NOT_FOUND_ERROR.CODE,
        AGENDA_CATEGORY_NOT_FOUND_ERROR.PARAM,
      );
    }
    const currentOrg = await AgendaCategoryModel.findById(
      existingAgendaCategory._id,
    )
      .select("organizationId")
      .lean();

    const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
      (organizationId) => organizationId?.toString() === currentOrg?.toString(),
    );

    if (
      currentUserIsOrgAdmin === false &&
      !currentUserAppProfile.isSuperAdmin
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    // Update the AgendaCategory
    const updatedAgendaCategory = await AgendaCategoryModel.findByIdAndUpdate(
      args.id,
      {
        $set: {
          updatedBy: context.userId,

          ...(args.input as UpdateAgendaCategoryInput),
        },
      },
      {
        new: true,
      },
    ).lean();

    return updatedAgendaCategory as InterfaceAgendaCategory;
  };
