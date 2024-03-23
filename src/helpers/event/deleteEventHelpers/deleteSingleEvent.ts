import type mongoose from "mongoose";
import {
  ActionItem,
  AppUserProfile,
  Event,
  EventAttendee,
  User,
} from "../../../models";

/**
 * This function deletes a single event.
 * @param event - the event to be deleted:
 * @remarks The following steps are followed:
 * 1. remove the associations of the event.
 * 2. delete the event.
 */

export const deleteSingleEvent = async (
  eventId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  // remove the associations of the current event
  await Promise.all([
    EventAttendee.deleteMany(
      {
        eventId,
      },
      { session },
    ),
    User.updateMany(
      { registeredEvents: eventId },
      {
        $pull: {
          registeredEvents: eventId,
        },
      },
      { session },
    ),
    AppUserProfile.updateMany(
      {
        $or: [{ createdEvents: eventId }, { eventAdmin: eventId }],
      },
      {
        $pull: {
          createdEvents: eventId,
          eventAdmin: eventId,
        },
      },
      { session },
    ),
    ActionItem.deleteMany({ eventId }, { session }),
  ]);

  // delete the event
  await Event.deleteOne(
    {
      _id: eventId,
    },
    {
      session,
    },
  );
};
