import type mongoose from "mongoose";
import { ActionItem, Event, EventAttendee, User } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

export const deleteSingleEvent = async (
  eventId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  await Promise.all([
    EventAttendee.deleteMany(
      {
        eventId,
      },
      { session },
    ),
    User.updateMany(
      {
        $or: [
          { createdEvents: eventId },
          { eventAdmin: eventId },
          { registeredEvents: eventId },
        ],
      },
      {
        $pull: {
          createdEvents: eventId,
          eventAdmin: eventId,
          registeredEvents: eventId,
        },
      },
      { session },
    ),
    ActionItem.deleteMany({ eventId }, { session }),
  ]);

  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
    },
    {
      status: "DELETED",
    },
    {
      new: true,
      session,
    },
  );

  if (updatedEvent !== null) {
    await cacheEvents([updatedEvent]);
  }
};
