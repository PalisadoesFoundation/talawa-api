import { Schema, model, models } from "mongoose";
import type { Model, Types } from "mongoose";

export interface InterfaceVenue {
  _id: Types.ObjectId;
  name: string;
  description: string;
  capacity: number;
  imageUrl: string | undefined | null;
}

/**
 * This describes the schema for a Venue that corresponds to InterfaceVenue document.
 * @param name - Name of the venue.
 * @param description - Description of the venue.
 * @param capacity - Maximum capacity of the venue.
 * @param imageUrl - Image URL(if attached) of the venue.
 */

const venueSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
});

const venueModel = (): Model<InterfaceVenue> =>
  model<InterfaceVenue>("Venue", venueSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Venue = (models.Venue || venueModel()) as ReturnType<
  typeof venueModel
>;
