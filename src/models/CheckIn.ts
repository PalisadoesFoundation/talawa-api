import {
  Schema,
  model,
  type PopulatedDoc,
  type Types,
  type Document,
  models,
  type Model,
} from "mongoose";
import { type InterfaceEventAttendee } from "./EventAttendee";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a document for a check-in entry in the MongoDB database.
 */
export interface InterfaceCheckIn {
  _id: Types.ObjectId;
  eventAttendeeId: PopulatedDoc<InterfaceEventAttendee & Document>;
  time: Date;
  feedbackSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for a check-in document.
 * @param eventAttendeeId - Reference to the event attendee associated with the check-in.
 * @param time - Date and time of the check-in.
 * @param feedbackSubmitted - Indicates if feedback was submitted for the check-in.
 * @param createdAt - Date when the check-in entry was created.
 * @param updatedAt - Date when the check-in entry was last updated.
 */
const checkInSchema = new Schema(
  {
    eventAttendeeId: {
      type: Schema.Types.ObjectId,
      ref: "EventAttendee",
      required: true,
    },
    time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    feedbackSubmitted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Create an index for faster querying by eventAttendeeId
checkInSchema.index({
  eventAttendeeId: 1,
});

// Apply logging middleware to the schema
createLoggingMiddleware(checkInSchema, "CheckIn");

/**
 * Returns the Mongoose Model for CheckIn to prevent OverwriteModelError.
 */
const checkInModel = (): Model<InterfaceCheckIn> =>
  model<InterfaceCheckIn>("CheckIn", checkInSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.

export const CheckIn = (models.CheckIn || checkInModel()) as ReturnType<
  typeof checkInModel
>;
