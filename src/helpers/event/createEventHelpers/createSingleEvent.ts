import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { AppUserProfile, Event, EventAttendee, User } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

/**
 * This function generates a single non-recurring event.
 * @param args - the arguments provided for the createEvent mutation.
 * @param creatorId - _id of the current user.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Create an event document.
 * 2. Associate the event with the user
 * 3. Cache the event.
 * @returns The created event.
 */

export const createSingleEvent = async (
  args: MutationCreateEventArgs,
  creatorId: string,
  organizationId: string,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  // create the single event
  const createdEvent = await Event.create(
    [
      {
        ...args.data,
        creatorId,
        admins: [creatorId],
        organization: organizationId,
      },
    ],
    { session },
  );

  // associate event with the user
  await EventAttendee.create(
    [
      {
        userId: creatorId,
        eventId: createdEvent[0]?._id,
      },
    ],
    { session },
  );
  await User.updateOne(
    {
      _id: creatorId,
    },
    {
      $push: {
        registeredEvents: createdEvent[0]?.id,
      },
    },
    { session },
  );
  await AppUserProfile.updateOne(
    {
      userId: creatorId,
    },
    {
      $push: {
        eventAdmin: createdEvent[0]?._id,
        createdEvents: createdEvent[0]?._id,
      },
    },
    { session },
  );

  // cache the event
  await cacheEvents([createdEvent[0]]);

  return createdEvent[0];
};
