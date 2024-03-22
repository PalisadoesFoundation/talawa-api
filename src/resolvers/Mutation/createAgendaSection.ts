import { Types } from "mongoose";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AgendaSectionModel, AppUserProfile, Event, User } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the GraphQL mutation 'createAgendaSection'.
 *
 * This resolver creates a new agenda section and performs necessary authorization checks.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation.
 * @param context - The context object containing user information.
 * @returns A promise that resolves to the created agenda section.
 */
export const createAgendaSection: MutationResolvers["createAgendaSection"] =
  async (_parent, args, context) => {
    // Verify that args and args.input exist
    const userId = context.userId;
    const currentUser = await User.findOne({
      _id: userId,
    }).lean();

    // If the user is not found, throw a NotFoundError
    if (!currentUser) {
      throw new errors.NotFoundError(
        USER_NOT_FOUND_ERROR.MESSAGE,
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const currentAppUserProfile = await AppUserProfile.findOne({
      userId: currentUser?._id,
    }).lean();
    if (!currentAppUserProfile) {
      throw new errors.UnauthenticatedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
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
            (organizationId && organizationId === event?.organization) ||
            new Types.ObjectId(organizationId?.toString()).equals(
              event?.organization,
            ),
        );
      const currentUserIsEventAdmin = event.admins.some((admin) =>
        admin.equals(currentUser._id),
      );
      if (
        !(
          currentUserIsOrganizationAdmin ||
          currentUserIsEventAdmin ||
          !currentAppUserProfile.isSuperAdmin
        )
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
