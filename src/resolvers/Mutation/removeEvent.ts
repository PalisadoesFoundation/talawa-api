import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Event } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
/**
 * This function enables to remove an event.
 * @param _parent - parent of current request
 * @param args- payload provided with the request
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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const event = await Event.findOne({
    _id: args.input.id,
  }).lean();

  // Checks whether event exists.
  if (!event) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_NOT_FOUND_ERROR.MESSAGE),
      EVENT_NOT_FOUND_ERROR.CODE,
      EVENT_NOT_FOUND_ERROR.PARAM
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
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
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
