import type { PopulatedDoc, Document, Model, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceEventVolunteerGroup } from "./EventVolunteerGroup";
import type { InterfaceActionItem } from "./ActionItem";

/**
 * Represents a document for an event volunteer in the MongoDB database.
 * This interface defines the structure and types of data that an event volunteer document will hold.
 */
export interface InterfaceEventVolunteer {
  _id: Types.ObjectId;
  creator: PopulatedDoc<InterfaceUser & Document>;
  event: PopulatedDoc<InterfaceEvent & Document>;
  groups: PopulatedDoc<InterfaceEventVolunteerGroup & Document>[];
  user: PopulatedDoc<InterfaceUser & Document>;
  hasAccepted: boolean;
  isPublic: boolean;
  hoursVolunteered: number;
  assignments: PopulatedDoc<InterfaceActionItem & Document>[];
  hoursHistory: {
    hours: number;
    date: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for an event volunteer document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param creator - Reference to the user who created the event volunteer entry.
 * @param event - Reference to the event for which the user volunteers.
 * @param groups - Reference to the volunteer groups associated with the event.
 * @param user - Reference to the user who is volunteering for the event.
 * @param hasAccepted - Indicates if the volunteer has accepted invite.
 * @param isPublic - Indicates if the volunteer is public.
 * @param hoursVolunteered - Total hours volunteered by the user.
 * @param assignments - List of action items assigned to the volunteer.
 * @param createdAt - Timestamp of when the event volunteer document was created.
 * @param updatedAt - Timestamp of when the event volunteer document was last updated.
 */
const eventVolunteerSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "EventVolunteerGroup",
        default: [],
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hasAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isPublic: {
      type: Boolean,
      required: true,
      default: true,
    },
    hoursVolunteered: {
      type: Number,
      default: 0,
    },
    assignments: [
      {
        type: Schema.Types.ObjectId,
        ref: "ActionItem",
        default: [],
      },
    ],
    hoursHistory: {
      type: [
        {
          hours: {
            type: Number,
            required: true,
          },
          date: {
            type: Date,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

// Add index on hourHistory.date
eventVolunteerSchema.index({ "hourHistory.date": 1 });

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
