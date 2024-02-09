import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import { format } from "date-fns";

/**
 * This function generates a single non-recurring event.
 * @param args - the arguments provided for the createEvent mutation.
 * @param currentUserId - _id of the current user.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Create an event document.
 * 2. Associate the event with the user
 * 3. Cache the event.
 * @returns The event generated.
 */

export const createSingleEvent = async (
  args: Partial<MutationCreateEventArgs>,
  currentUserId: string,
  organizationId: string,
  session: mongoose.ClientSession
): Promise<Promise<InterfaceEvent>> => {
  const formattedStartDate = format(args.data?.startDate, "yyyy-MM-dd");
  const formattedEndDate = format(args.data?.endDate, "yyyy-MM-dd");

  // create the single event
  const createdEvent = await Event.create(
    [
      {
        ...args.data,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        creatorId: currentUserId,
        admins: [currentUserId],
        organization: organizationId,
      },
    ],
    { session }
  );

  // associate event with the user
  await EventAttendee.create(
    [
      {
        userId: currentUserId,
        eventId: createdEvent[0]?._id,
      },
    ],
    { session }
  );
  await User.updateOne(
    {
      _id: currentUserId,
    },
    {
      $push: {
        eventAdmin: createdEvent[0]?._id,
        createdEvents: createdEvent[0]?._id,
        registeredEvents: createdEvent[0]?._id,
      },
    },
    { session }
  );

  // cache the event
  await cacheEvents([createdEvent[0]]);

  return createdEvent[0];
};
