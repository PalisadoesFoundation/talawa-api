import type mongoose from "mongoose";
import { EventAttendee, User } from "../../../models";

/**
 * This function associates an event with the user.
 * @param currentUserId - _id of the current user.
 * @param createdEventId - _id of the event.
 * @remarks The following steps are followed:
 * 1. Create an EventAttendee (adding the user as an attendee).
 * 2. Update the event related user fields.
 */

export const associateEventWithUser = async (
  currentUserId: string,
  createdEventId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  await Promise.all([
    EventAttendee.create(
      [
        {
          userId: currentUserId,
          eventId: createdEventId,
        },
      ],
      { session },
    ),
    User.updateOne(
      {
        _id: currentUserId,
      },
      {
        $push: {
          eventAdmin: createdEventId,
          createdEvents: createdEventId,
          registeredEvents: createdEventId,
        },
      },
      { session },
    ),
  ]);
};
