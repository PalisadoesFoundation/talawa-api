import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteerGroup } from "./EventVolunteerGroup";

/**
 * Represents a document for an event volunteer in the MongoDB database.
 * This interface defines the structure and types of data that an event volunteer document will hold.
 */
export interface InterfaceEventVolunteer {
  _id: Types.ObjectId;
  createdAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  groupId: PopulatedDoc<InterfaceEventVolunteerGroup & Document>;
  isAssigned: boolean;
  isInvited: boolean;
  response: string;
  updatedAt: Date;
  userId: PopulatedDoc<InterfaceUser & Document>;
}

/**
 * Mongoose schema definition for an event volunteer document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param creatorId - Reference to the user who created the event volunteer entry.
 * @param eventId - Reference to the event for which the user volunteers.
 * @param groupId - Reference to the volunteer group associated with the event.
 * @param response - Response status of the volunteer ("YES", "NO", null).
 * @param isAssigned - Indicates if the volunteer is assigned to a specific role.
 * @param isInvited - Indicates if the volunteer has been invited to participate.
 * @param userId - Reference to the user who is volunteering for the event.
 * @param createdAt - Timestamp of when the event volunteer document was created.
 * @param updatedAt - Timestamp of when the event volunteer document was last updated.
 */
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
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "EventVolunteerGroup",
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
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

// Apply logging middleware to the schema
createLoggingMiddleware(eventVolunteerSchema, "EventVolunteer");

/**
 * Creates a Mongoose model for the event volunteer schema.
 * This function ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The EventVolunteer model.
 */
const eventVolunteerModel = (): Model<InterfaceEventVolunteer> =>
  model<InterfaceEventVolunteer>("EventVolunteer", eventVolunteerSchema);

/**
 * Export the EventVolunteer model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const EventVolunteer = (models.EventVolunteer ||
  eventVolunteerModel()) as ReturnType<typeof eventVolunteerModel>;
