import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteer } from "./EventVolunteer";
import type { InterfaceActionItem } from "./ActionItem";

/**
 * Represents a document for an event volunteer group in the MongoDB database.
 * This interface defines the structure and types of data that an event volunteer group document will hold.
 */
export interface InterfaceEventVolunteerGroup {
  _id: Types.ObjectId;
  creator: PopulatedDoc<InterfaceUser & Document>;
  event: PopulatedDoc<InterfaceEvent & Document>;
  leader: PopulatedDoc<InterfaceUser & Document>;
  name: string;
  description?: string;
  volunteers: PopulatedDoc<InterfaceEventVolunteer & Document>[];
  volunteersRequired?: number;
  assignments: PopulatedDoc<InterfaceActionItem & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for an event volunteer group document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param creator - Reference to the user who created the event volunteer group entry.
 * @param event - Reference to the event for which the volunteer group is created.
 * @param leader - Reference to the leader of the volunteer group.
 * @param name - Name of the volunteer group.
 * @param description - Description of the volunteer group (optional).
 * @param volunteers - List of volunteers in the group.
 * @param volunteersRequired - Number of volunteers required for the group (optional).
 * @param assignments - List of action items assigned to the volunteer group.
 * @param createdAt - Timestamp of when the event volunteer group document was created.
 * @param updatedAt - Timestamp of when the event volunteer group document was last updated.
 */
const eventVolunteerGroupSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    assignments: [
      {
        type: Schema.Types.ObjectId,
        ref: "ActionItem",
        default: [],
      },
    ],
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
