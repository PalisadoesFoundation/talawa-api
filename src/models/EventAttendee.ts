import type { PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import type { InterfaceCheckIn } from "./CheckIn";
import type { InterfaceCheckOut } from "./CheckOut";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for an event attendee in MongoDB.
 */
export interface InterfaceEventAttendee {
  _id: Schema.Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  checkInId: PopulatedDoc<InterfaceCheckIn & Document> | null;
  checkOutId: PopulatedDoc<InterfaceCheckOut & Document> | null;
  isInvited: boolean;
  isRegistered: boolean;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
}

/**
 * Mongoose schema for an event attendee.
 * @param userId - Reference to the user attending the event.
 * @param eventId - Reference to the event the attendee is associated with.
 * @param checkInId - Reference to the check-in record if checked in, or null.
 * @param checkOutId - Reference to the check-out record if checked out, or null.
 * @param isInvited - Indicates if the attendee is invited to the event.
 * @param isRegistered - Indicates if the attendee is registered for the event.
 * @param isCheckedIn - Indicates if the attendee is checked in to the event.
 * @param isCheckedOut - Indicates if the attendee is checked out from the event.
 */
const eventAttendeeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  checkInId: {
    type: Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: "CheckIn",
  },
  checkOutId: {
    type: Schema.Types.ObjectId,
    required: false,
    default: null,
    ref: "CheckOut",
  },

  isInvited: {
    type: Boolean,
    default: false,
    required: true,
  },

  isRegistered: {
    type: Boolean,
    default: false,
    required: true,
  },

  isCheckedIn: {
    type: Boolean,
    default: false,
    required: true,
  },

  isCheckedOut: {
    type: Boolean,
    default: false,
    required: true,
  },
});

// Ensure uniqueness of combinations of userId and eventId
eventAttendeeSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Add logging middleware for eventAttendeeSchema
createLoggingMiddleware(eventAttendeeSchema, "EventAttendee");

const eventAttendeeModel = (): Model<InterfaceEventAttendee> =>
  model<InterfaceEventAttendee>("EventAttendee", eventAttendeeSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventAttendee = (models.EventAttendee ||
  eventAttendeeModel()) as ReturnType<typeof eventAttendeeModel>;
