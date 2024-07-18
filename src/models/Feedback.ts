import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a document for feedback in the MongoDB database.
 * This interface defines the structure and types of data that a feedback document will hold.
 */
export interface InterfaceFeedback {
  _id: Types.ObjectId;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  rating: number;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for a feedback document.
 * This schema defines how the data will be stored in the MongoDB database.
 *
 * @param eventId - Reference to the event for which the feedback is given.
 * @param rating - The rating given for the event.
 * @param review - The review text provided for the event (optional).
 * @param createdAt - Timestamp of when the feedback document was created.
 * @param updatedAt - Timestamp of when the feedback document was last updated.
 */
const feedbackSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
      max: 5,
    },
    review: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

// Create an index on the eventId field for faster database querying
feedbackSchema.index({
  eventId: 1,
});

// Enable logging on changes in the Feedback collection
createLoggingMiddleware(feedbackSchema, "Feedback");

/**
 * Creates a Mongoose model for the feedback schema.
 * This function ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The Feedback model.
 */
const feedbackModel = (): Model<InterfaceFeedback> =>
  model<InterfaceFeedback>("Feedback", feedbackSchema);

/**
 * Export the Feedback model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const Feedback = (models.Feedback || feedbackModel()) as ReturnType<
  typeof feedbackModel
>;
