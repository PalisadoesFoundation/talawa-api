import mongoose from "mongoose";
import {
  EVENT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import {
  AgendaItemModel,
  AppUserProfile,
  Event,
  Organization,
  User,
} from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Creates a new agenda item and associates it with an event if specified.
 *
 * This function performs the following actions:
 * 1. Verifies that the current user exists and is authorized.
 * 2. Checks the existence of the specified organization.
 * 3. If a related event is specified, verifies its existence and checks if the user is an admin of the event.
 * 4. Checks if the user is an admin of the organization or has super admin privileges.
 * 5. Creates the new agenda item and associates it with the event if applicable.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `input`: An object containing:
 *     - `organizationId`: The ID of the organization where the agenda item will be created.
 *     - `relatedEventId` (optional): The ID of the related event, if applicable.
 *     - Other agenda item details.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns The created agenda item.
 *
 */
export const createAgendaItem: MutationResolvers["createAgendaItem"] = async (
  _parent,
  args,
  context,
) => {
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
      userId: currentUser._id,
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

  let currentUserIsEventAdmin = false;

  if (args.input.relatedEventId) {
    let currEvent: InterfaceEvent | null;

    const eventFoundInCache = await findEventsInCache([
      args.input.relatedEventId,
    ]);

    currEvent = eventFoundInCache[0];

    if (eventFoundInCache[0] === null) {
      currEvent = await Event.findOne({
        _id: args.input.relatedEventId,
      }).lean();

      if (currEvent !== null) {
        await cacheEvents([currEvent]);
      }
    }

    // Checks whether currEvent exists.
    if (!currEvent) {
      throw new errors.NotFoundError(
        requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
        EVENT_NOT_FOUND_ERROR.CODE,
        EVENT_NOT_FOUND_ERROR.PARAM,
      );
    }

    // Checks if the currUser is an admin of the event
    currentUserIsEventAdmin = currEvent.admins.some(
      (admin) =>
        admin === context.userID ||
        new mongoose.Types.ObjectId(admin.toString()).equals(context.userId),
    );
  }

  // Checks if the currUser is an admin of the organization
  const currentUserIsOrgAdmin = currentAppUserProfile.adminFor.some(
    (organizationId) =>
      (organizationId &&
        organizationId.toString() === args.input.organizationId.toString()) ||
      new mongoose.Types.ObjectId(organizationId?.toString()).equals(
        args.input.organizationId,
      ),
  );

  // Checks whether currentUser with _id === context.userId is authorized for the operation.
  if (
    currentUserIsEventAdmin === false &&
    currentUserIsOrgAdmin === false &&
    !currentAppUserProfile.isSuperAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const createdAgendaItem = await AgendaItemModel.create({
    ...args.input,
    createdBy: currentUser._id,
    relatedEventId: args.input.relatedEventId,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  await Event.findByIdAndUpdate(
    {
      _id: args.input.relatedEventId,
    },
    {
      $push: {
        agendaItems: createdAgendaItem,
      },
    },
    { new: true },
  );
  return createdAgendaItem.toObject();
};
