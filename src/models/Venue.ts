import { Schema, model, models } from "mongoose";
import type { Model, Types, PopulatedDoc } from "mongoose";
import type { InterfaceOrganization } from "./Organization";

export interface InterfaceVenue {
  _id: Types.ObjectId;
  name: string;
  description: string | undefined | null;
  capacity: number;
  imageUrl: string | undefined | null;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
}

/**
 * This describes the schema for a Venue that corresponds to InterfaceVenue document.
 * @param name - Name of the venue.
 * @param description - Description of the venue.
 * @param capacity - Maximum capacity of the venue.
 * @param imageUrl - Image URL(if attached) of the venue.
 * @param organization - Organization in which the venue belongs.
 */

const venueSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  capacity: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
});

const venueModel = (): Model<InterfaceVenue> =>
  model<InterfaceVenue>("Venue", venueSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Venue = (models.Venue || venueModel()) as ReturnType<
  typeof venueModel
>;
