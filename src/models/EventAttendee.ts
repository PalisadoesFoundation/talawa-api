import type { PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";

export interface InterfaceEventAttendee {
  userId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
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
});

eventAttendeeSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const eventAttendeeModel = (): Model<InterfaceEventAttendee> =>
  model<InterfaceEventAttendee>("TagUser", eventAttendeeSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventAttendee = (models.EventAttendee ||
  eventAttendeeModel()) as ReturnType<typeof eventAttendeeModel>;
