import type mongoose from "mongoose";
import {
  ActionItem,
  AppUserProfile,
  Event,
  EventAttendee,
  User,
} from "../../../models";
import { removeDanglingDocuments } from "../recurringEventHelpers";

/**
 * Deletes a single event.
 *
 * @param eventId - The ID of the event to be deleted.
 * @param session - The MongoDB client session for transactional operations.
 * @param recurrenceRule - Optional ID of the recurrence rule associated with the event (for recurring events).
 * @param baseRecurringEvent - Optional ID of the base recurring event (for recurring events).
 *
 * @remarks
 * This function performs the following steps:
 * 1. Removes all associations (attendees, users, profiles, action items) related to the event.
 * 2. Deletes the event document itself.
 * 3. If provided, removes any dangling documents related to the recurrence rule and base recurring event.
 */
export const deleteSingleEvent = async (
  eventId: string,
  session: mongoose.ClientSession,
  recurrenceRule?: string,
  baseRecurringEvent?: string,
): Promise<void> => {
  // Remove associations of the current event
  await Promise.all([
    EventAttendee.deleteMany({ eventId }, { session }),
    User.updateMany(
      { registeredEvents: eventId },
      { $pull: { registeredEvents: eventId } },
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
    Event.deleteOne({ _id: eventId }, { session }),
  ]);

  // If deleting a recurring event, remove any dangling recurrence rule and base recurring event documents
  if (recurrenceRule && baseRecurringEvent) {
    await removeDanglingDocuments(recurrenceRule, baseRecurringEvent, session);
  }
};
