import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
import {
  deleteRecurringEvent,
  deleteSingleEvent,
} from "../../helpers/event/deleteEventHelpers";
import { session } from "../../db";
/**
 * This function enables to remove an event.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the event exists
 * 3. If the user is an admin of the organization.
 * 4. If the user is an admin of the event.
 * @returns Deleted event.
 */
export const removeEvent: MutationResolvers["removeEvent"] = async (
  _parent,
  args,
  context,
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
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

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Boolean to determine whether user is an admin of organization.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.equals(event?.organization),
  );

  // Boolean to determine whether user is an admin of event.
  const currentUserIsEventAdmin = event.admins.some((admin) =>
    admin.equals(currentUser._id),
  );

  // Checks whether currentUser cannot delete event.
  if (
    !(
      currentUserIsOrganizationAdmin ||
      currentUserIsEventAdmin ||
      currentUser.userType === "SUPERADMIN"
    )
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  /* c8 ignore start */
  if (session) {
    // start a transaction
    session.startTransaction();
  }

  /* c8 ignore stop */
  try {
    if (event.recurring) {
      // if the event is recurring
      await deleteRecurringEvent(args, event, session);
    } else {
      // if the event is non-recurring
      await deleteSingleEvent(event._id.toString(), session);
    }

    /* c8 ignore start */
    if (session) {
      // commit transaction if everything's successful
      await session.commitTransaction();
    }
  } catch (error) {
    if (session) {
      // abort transaction if something fails
      await session.abortTransaction();
    }

    throw error;
  }

  /* c8 ignore stop */
  return event;
};
