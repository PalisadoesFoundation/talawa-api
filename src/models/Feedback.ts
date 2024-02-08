import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceEvent } from "./Event";

export interface InterfaceFeedback {
  _id: Types.ObjectId;
  eventId: PopulatedDoc<InterfaceEvent & Document>;
  rating: number;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
    timestamps: true,
  }
);

// We will also create an index here for faster database querying
feedbackSchema.index({
  eventId: 1,
});

const feedbackModel = (): Model<InterfaceFeedback> =>
  model<InterfaceFeedback>("Feedback", feedbackSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Feedback = (models.Feedback || feedbackModel()) as ReturnType<
  typeof feedbackModel
>;
