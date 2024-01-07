import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export interface InterfaceVenue {
  _id: Types.ObjectId;
  place: string;
  capacity: number;
}

/**
 * This describes the schema for a Venue that corresponds to InterfaceVenue document.
 * @param name - Name of the venue.
 * @param capacity - Maximum capacity of the venue.
 */

const venueSchema = new Schema({
  place: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
});

const venueModel = (): Model<InterfaceVenue> =>
  model<InterfaceVenue>("Venue", venueSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Venue = (models.Venue || venueModel()) as ReturnType<
  typeof venueModel
>;
