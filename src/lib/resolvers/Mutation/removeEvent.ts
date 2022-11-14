import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User, Event } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_CODE,
  EVENT_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../../constants";
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
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const event = await Event.findOne({
    _id: args.id,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  // Boolean to determine whether user is an admin of organization.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.toString() === event.organization.toString()
  );

  // Boolean to determine whether user is an admin of event.
  const currentUserIsEventAdmin = event.admins.some(
    (admin) => admin.toString() === currentUser._id.toString()
  );

  // Checks whether currentUser cannot delete event.
  if (!(currentUserIsOrganizationAdmin || currentUserIsEventAdmin)) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  await User.updateMany(
    {
      createdEvents: event._id,
    },
    {
      $pull: {
        createdEvents: event._id,
      },
    }
  );

  await User.updateMany(
    {
      eventAdmin: event._id,
    },
    {
      $pull: {
        eventAdmin: event._id,
      },
    }
  );

  await Event.updateOne(
    {
      _id: event._id,
    },
    {
      status: "DELETED",
    }
  );

  return event;
};
