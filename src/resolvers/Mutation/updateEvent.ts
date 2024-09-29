import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEvent,
  InterfaceUser,
} from "../../models";
import { User, Event, AppUserProfile } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  LENGTH_VALIDATION_ERROR,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import { session } from "../../db";
import {
  updateRecurringEvent,
  updateSingleEvent,
} from "../../helpers/event/updateEventHelpers";
import mongoose from "mongoose";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";

/**
 * This function enables to update an event.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the event exists.
 * 3. The the user is an admin of the event.
 * @returns Updated event.
 */

export const updateEvent: MutationResolvers["updateEvent"] = async (
  _parent,
  args,
  context,
) => {
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

  // checks if current user exists
  if (currentUser === null) {
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

  let event: InterfaceEvent | null;

  const eventFoundInCache = await findEventsInCache([args.id]);

  event = eventFoundInCache[0];

  if (eventFoundInCache[0] === null) {
    event = await Event.findOne({
      _id: args.id,
    }).lean();

    if (event !== null) {
      await cacheEvents([event]);
    }
  }

  // checks if there exists an event with _id === args.id
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Boolean to determine whether user is an admin of organization.
  const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
    (organization) =>
      organization &&
      new mongoose.Types.ObjectId(organization.toString()).equals(
        event?.organization,
      ),
  );

  // Boolean to determine whether user is an admin of event.
  const currentUserIsEventAdmin = event.admins.some(
    (admin) =>
      admin === context.userID ||
      new mongoose.Types.ObjectId(admin.toString()).equals(context.userId),
  );

  // Checks whether currentUser cannot update event.
  if (
    !(
      currentUserIsOrganizationAdmin ||
      currentUserIsEventAdmin ||
      currentUserAppProfile.isSuperAdmin
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResultTitle = isValidString(args.data?.title ?? "", 256);
  const validationResultDescription = isValidString(
    args.data?.description ?? "",
    500,
  );
  const validationResultLocation = isValidString(args.data?.location ?? "", 50);
  if (!validationResultTitle.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }
  if (!validationResultDescription.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in description`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }
  if (!validationResultLocation.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 50 characters in location`,
      ),
      LENGTH_VALIDATION_ERROR.CODE,
    );
  }

  /* c8 ignore start */
  if (session) {
    // start a transaction
    session.startTransaction();
  }

  /* c8 ignore stop */
  try {
    let updatedEvent: InterfaceEvent = event;

    if (event.recurring) {
      // update recurring event
      updatedEvent = await updateRecurringEvent(args, event, session);
    } else {
      // update single event
      updatedEvent = await updateSingleEvent(args, event, session);
    }

    /* c8 ignore start */
    if (session) {
      // commit transaction if everything's successful
      await session.commitTransaction();
    }

    /* c8 ignore stop */
    return updatedEvent;
    /* c8 ignore start */
  } catch (error) {
    if (session) {
      // abort transaction if something fails
      await session.abortTransaction();
    }

    throw error;
  }

  /* c8 ignore stop */
};
