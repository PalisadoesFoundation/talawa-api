import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteer } from "./EventVolunteer";

/**
 * Represents a document for an event volunteer group in the MongoDB database.
 * This interface defines the structure and types of data that an event volunteer group document will hold.
 */
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

/**
 * Mongoose schema definition for an event volunteer group document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param creatorId - Reference to the user who created the event volunteer group entry.
 * @param eventId - Reference to the event for which the volunteer group is created.
 * @param leaderId - Reference to the leader of the volunteer group.
 * @param name - Name of the volunteer group.
 * @param volunteers - List of volunteers in the group.
 * @param volunteersRequired - Number of volunteers required for the group (optional).
 * @param createdAt - Timestamp of when the event volunteer group document was created.
 * @param updatedAt - Timestamp of when the event volunteer group document was last updated.
 */
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
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

// Enable logging on changes in EventVolunteerGroup collection
createLoggingMiddleware(eventVolunteerGroupSchema, "EventVolunteerGroup");

/**
 * Creates a Mongoose model for the event volunteer group schema.
 * This function ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The EventVolunteerGroup model.
 */
const eventVolunteerGroupModel = (): Model<InterfaceEventVolunteerGroup> =>
  model<InterfaceEventVolunteerGroup>(
    "EventVolunteerGroup",
    eventVolunteerGroupSchema,
  );

/**
 * Export the EventVolunteerGroup model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const EventVolunteerGroup = (models.EventVolunteerGroup ||
  eventVolunteerGroupModel()) as ReturnType<typeof eventVolunteerGroupModel>;
