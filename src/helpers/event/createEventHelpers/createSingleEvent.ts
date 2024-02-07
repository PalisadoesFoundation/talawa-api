import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";
import { associateEventWithUser } from "./associateEventWithUser";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

/**
 * This function generates a single non-recurring event.
 * @param args - the arguments provided for the createEvent mutation.
 * @param currentUserId - _id of the current user.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Create an event document.
 * 2. Associate the event with the user and cache it.
 * @returns The event generated.
 */

export const createSingleEvent = async (
  args: Partial<MutationCreateEventArgs>,
  currentUserId: string,
  organizationId: string,
  session: mongoose.ClientSession
): Promise<Promise<InterfaceEvent>> => {
  // create the single event
  const createdEvent = await Event.create(
    [
      {
        ...args.data,
        creatorId: currentUserId,
        admins: [currentUserId],
        organization: organizationId,
      },
    ],
    { session }
  );

  // associate the event with the user
  await associateEventWithUser(
    currentUserId,
    createdEvent[0]?._id.toString(),
    session
  );
  await cacheEvents([createdEvent[0]]);

  return createdEvent[0];
};
