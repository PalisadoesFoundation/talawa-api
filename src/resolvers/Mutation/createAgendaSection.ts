import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { AgendaSectionModel, AppUserProfile, Event, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new agenda section and performs authorization checks.
 *
 * This resolver performs the following steps:
 *
 * 1. Retrieves the current user based on the userId from the context.
 * 2. Fetches the associated app user profile for the current user.
 * 3. Validates the existence of the related event and checks user permissions.
 * 4. Creates a new agenda section and sets the appropriate metadata.
 *
 * @param _parent - The parent object for the mutation (not used in this function).
 * @param args - The arguments provided with the mutation, including:
 *   - `input`: An object containing:
 *     - `relatedEvent`: The ID of the event to which the new agenda section is related.
 *     - Additional fields for the agenda section.
 * @param context - The context of the entire application, including user information (context.userId).
 *
 * @returns A promise that resolves to the created agenda section object.
 *
 * @remarks This function performs caching and retrieval operations to ensure the latest data is used.
 * It also verifies that the user has the necessary permissions to create the agenda section in the context of the specified event.
 */
export const createAgendaSection: MutationResolvers["createAgendaSection"] =
  async (_parent, args, context) => {
    // Verify that args and args.input exist
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
    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        USER_NOT_FOUND_ERROR.MESSAGE,
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
        userId: currentUser._id,
      }).lean();
      if (currentAppUserProfile !== null) {
        await cacheAppUserProfile([currentAppUserProfile]);
      }
    }
    if (!currentAppUserProfile) {
      throw new errors.UnauthenticatedError(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    const event = await Event.findOne({
      _id: args.input.relatedEvent?.toString(),
    });
    if (!event) {
      throw new errors.NotFoundError(
        EVENT_NOT_FOUND_ERROR.MESSAGE,
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    if (event) {
      const currentUserIsOrganizationAdmin =
        currentAppUserProfile.adminFor.some(
          (organizationId) =>
            organizationId && organizationId === event?.organization,
        );
      const currentUserIsEventAdmin = event.admins.some((admin) =>
        admin.equals(currentUser?._id),
      );
      if (
        !currentUserIsOrganizationAdmin &&
        !currentUserIsEventAdmin &&
        !currentAppUserProfile.isSuperAdmin
      ) {
        throw new errors.UnauthorizedError(
          USER_NOT_AUTHORIZED_ERROR.MESSAGE,
          USER_NOT_AUTHORIZED_ERROR.CODE,
          USER_NOT_AUTHORIZED_ERROR.PARAM,
        );
      }
    }
    const now = new Date();
    const agendaSectionData = {
      ...args.input,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const createdAgendaSection =
      await AgendaSectionModel.create(agendaSectionData);

    return createdAgendaSection;
  };
