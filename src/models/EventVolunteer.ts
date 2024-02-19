import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceEventVolunteer {
  _id: Types.ObjectId;
  createdAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  isAssigned: boolean;
  isInvited: boolean;
  response: string;
  updatedAt: Date;
  userId: PopulatedDoc<InterfaceUser & Document>;
}

const eventVolunteerSchema = new Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    response: {
      type: String,
      enum: ["YES", "NO", null],
    },
    isAssigned: {
      type: Boolean,
    },
    isInvited: {
      type: Boolean,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Enable logging on changes in EventVolunteer collection
createLoggingMiddleware(eventVolunteerSchema, "EventVolunteer");

const eventVolunteerModel = (): Model<InterfaceEventVolunteer> =>
  model<InterfaceEventVolunteer>("EventVolunteer", eventVolunteerSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventVolunteer = (models.EventVolunteer ||
  eventVolunteerModel()) as ReturnType<typeof eventVolunteerModel>;
