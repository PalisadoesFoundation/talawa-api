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
 * This function deletes a single event.
 * @param event - the event to be deleted:
 * @remarks The following steps are followed:
 * 1. remove the associations of the event.
 * 2. delete the event.
 */

export const deleteSingleEvent = async (
  eventId: string,
  session: mongoose.ClientSession,
  recurrenceRule?: string,
  baseRecurringEvent?: string,
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

    Event.deleteOne(
      {
        _id: eventId,
      },
      {
        session,
      },
    ),
  ]);

  if (recurrenceRule && baseRecurringEvent) {
    // they would exist while we're deleting a recurring event
    // remove any dangling recurrence rule and base recurring event documents
    await removeDanglingDocuments(recurrenceRule, baseRecurringEvent, session);
  }
};
