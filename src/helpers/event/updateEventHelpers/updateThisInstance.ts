import type mongoose from "mongoose";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

/**
 * This function updates only this instance of a recurrence pattern.
 * This will make the instance an exception to the recurrence pattern.
 * @param args - update event args.
 * @param event - the event to be updated.
 * @remarks The following steps are followed:
 * 1. Update this instance.
 * @returns The updated recurring event instance.
 */

export const updateThisInstance = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  // update this instance
  updatedEvent = (await Event.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      isRecurringEventException: true,
      ...(args.data as Partial<InterfaceEvent>),
    },
    {
      new: true,
      session,
    },
  ).lean()) as InterfaceEvent;

  if (updatedEvent !== null) {
    await cacheEvents([updatedEvent]);
  }

  return updatedEvent;
};
