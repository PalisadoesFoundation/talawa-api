import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteer } from "./EventVolunteer";

export interface InterfaceEventVolunteerGroup {
  _id: Types.ObjectId;
  createdAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  leaderId: PopulatedDoc<InterfaceUser & Document>;
  name: string;
  updatedAt: Date;
  volunteers: PopulatedDoc<InterfaceEventVolunteer & Document>[];
  volunteersRequired?: number;
}

const eventVolunteerGroupSchema = new Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    volunteers: [
      {
        type: Schema.Types.ObjectId,
        ref: "EventVolunteer",
        default: [],
      },
    ],
    volunteersRequired: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

// Enable logging on changes in EventVolunteer collection
createLoggingMiddleware(eventVolunteerGroupSchema, "EventVolunteerGroup");

const eventVolunteerGroupModel = (): Model<InterfaceEventVolunteerGroup> =>
  model<InterfaceEventVolunteerGroup>(
    "EventVolunteerGroup",
    eventVolunteerGroupSchema,
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EventVolunteerGroup = (models.EventVolunteerGroup ||
  eventVolunteerGroupModel()) as ReturnType<typeof eventVolunteerGroupModel>;
