import type { PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import type { InterfaceCheckIn } from "./CheckIn";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceEventAttendee {
  _id: Schema.Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  checkInId: PopulatedDoc<InterfaceCheckIn & Document> | null;
  isInvited: boolean;
  isRegistered: boolean;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
}

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

eventAttendeeSchema.index({ userId: 1, eventId: 1 }, { unique: true });

createLoggingMiddleware(eventAttendeeSchema, "EventAttendee");

const eventAttendeeModel = (): Model<InterfaceEventAttendee> =>
  model<InterfaceEventAttendee>("EventAttendee", eventAttendeeSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventAttendee = (models.EventAttendee ||
  eventAttendeeModel()) as ReturnType<typeof eventAttendeeModel>;
