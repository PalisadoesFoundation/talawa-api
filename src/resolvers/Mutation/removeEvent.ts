import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import { User, Event, EventProject, Task, TaskVolunteer } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
import { findEventsInCache } from "../../services/EventCache/findEventInCache";
import { cacheEvents } from "../../services/EventCache/cacheEvents";
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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
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
      EVENT_NOT_FOUND_ERROR.PARAM
    );
  }

  // Boolean to determine whether user is an admin of organization.
  const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
    (organization) => organization.equals(event?.organization)
  );

  // Boolean to determine whether user is an admin of event.
  const currentUserIsEventAdmin = event.admins.some((admin) =>
    admin.equals(currentUser._id)
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

  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: event._id,
    },
    {
      status: "DELETED",
    },
    {
      new: true,
    }
  );

  if (updatedEvent !== null) {
    await cacheEvents([updatedEvent]);
  }

  // Fetch and delete all the event projects under the particular event
  const eventProjects = await EventProject.find(
    {
      event: event._id,
    },
    {
      _id: 1,
    }
  ).lean();
  const eventProjectIds = eventProjects.map((project) => project._id);
  await EventProject.deleteMany({
    event: event._id,
  });

  // Fetch and delete all the event tasks indirectly under the particular event
  const eventTasks = await Task.find(
    {
      eventProjectId: {
        $in: eventProjectIds,
      },
    },
    {
      _id: 1,
    }
  ).lean();
  const taskIds = eventTasks.map((task) => task._id);
  await Task.deleteMany({
    eventProjectId: {
      $in: eventProjectIds,
    },
  });

  // Delete all the task volunteer entries indirectly under the particular event
  await TaskVolunteer.deleteMany({
    taskId: {
      $in: taskIds,
    },
  });
  return event;
};
