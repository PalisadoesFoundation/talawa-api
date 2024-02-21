import type mongoose from "mongoose";
import { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { Event, InterfaceEvent } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

export const updateThisInstance = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  updatedEvent = await Event.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as Partial<InterfaceEvent>),
    },
    {
      new: true,
      session,
    },
  ).lean();

  if (updatedEvent !== null) {
    await cacheEvents([updatedEvent]);
  }

  return updatedEvent;
};
