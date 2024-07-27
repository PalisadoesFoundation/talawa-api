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
 * Interface representing a document for a check-out record in MongoDB.
 */
export interface InterfaceCheckOut {
  _id: Types.ObjectId;
  eventAttendeeId: PopulatedDoc<InterfaceEventAttendee & Document>;
  time: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for a check-out record.
 * @param eventAttendeeId - Reference to the event attendee associated with the check-out.
 * @param time - Time of the check-out.
 * @param createdAt - Timestamp when the check-out record was created.
 * @param updatedAt - Timestamp when the check-out record was last updated.
 */
const checkOutSchema = new Schema(
  {
    eventAttendeeId: {
      type: Schema.Types.ObjectId,
      ref: "EventAttendee", // Refers to the EventAttendee model
      required: true,
    },
    time: {
      type: Date,
      required: true,
      default: Date.now, // Default time is the current date/time
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  },
);

// Create an index for eventAttendeeId for optimized querying
checkOutSchema.index({
  eventAttendeeId: 1,
});

// Apply logging middleware for database operations on CheckOut collection
createLoggingMiddleware(checkOutSchema, "CheckOut");

/**
 * Retrieves or creates the Mongoose model for CheckOut.
 * Prevents Mongoose OverwriteModelError during testing.
 */
const checkOutModel = (): Model<InterfaceCheckOut> =>
  model<InterfaceCheckOut>("CheckOut", checkOutSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.

export const CheckOut = (models.CheckOut || checkOutModel()) as ReturnType<
  typeof checkOutModel
>;
