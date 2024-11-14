import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { AppUserProfile, Event, EventAttendee, User } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

/**
 * Creates a single non-recurring event.
 *
 * @param args - Arguments provided for the createEvent mutation, including event data.
 * @param creatorId - The ID of the current user creating the event.
 * @param organizationId - The ID of the organization to which the event belongs.
 * @param session - The MongoDB client session for transactional operations.
 *
 * @see Parent file:
 * - `resolvers/Mutation/createEvent.ts`,
 * - `resolvers/Query/eventsByOrganizationConnection.ts`
 *
 * @remarks
 * This function follows these steps:
 * 1. Creates an event document in the database with provided data.
 * 2. Associates the event with the current user as creator and admin.
 * 3. Updates user's registered events list with the new event.
 * 4. Updates user's AppUserProfile with event admin and created events references.
 * 5. Caches the newly created event for faster access.
 *
 * @returns The created event instance.
 */
export const createSingleEvent = async (
  args: MutationCreateEventArgs,
  creatorId: string,
  organizationId: string,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  // Create the single event in the database
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

  // Associate the event with the user
  await EventAttendee.create(
    [
      {
        userId: creatorId,
        eventId: createdEvent[0]?._id,
      },
    ],
    { session },
  );

  // Update the user's registered events list
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

  // Update the user's AppUserProfile with event admin and created events references
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

  // Cache the event for faster access
  await cacheEvents([createdEvent[0]]);

  // Return the created event instance
  return createdEvent[0];
};
