import type mongoose from "mongoose";
import type {
  InterfaceEvent,
  InterfaceUser} from "../../../models";
import {
  EventAttendee,
  User,
} from "../../../models";

export const associateEventWithUser = async (
  currentUser: InterfaceUser,
  createdEvent: InterfaceEvent,
  session: mongoose.ClientSession
): Promise<void> => {
  await EventAttendee.create(
    [
      {
        userId: currentUser._id.toString(),
        eventId: createdEvent._id,
      },
    ],
    { session }
  );

  await User.updateOne(
    {
      _id: currentUser._id,
    },
    {
      $push: {
        eventAdmin: createdEvent._id,
        createdEvents: createdEvent._id,
        registeredEvents: createdEvent._id,
      },
    },
    { session }
  );
};
