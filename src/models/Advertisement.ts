import type { PopulatedDoc, Model, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceOrganization } from "./Organization";

/**
 * Interface representing a database document for Advertisement in MongoDB.
 */
export interface InterfaceAdvertisement {
  _id: string;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  name: string;
  mediaUrl: string;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  type: "POPUP" | "MENU" | "BANNER";
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @param  name - Name of the advertisement (type: String)
 * Description: Name of the advertisement.
 */

/**
 * @param  organizationId - Organization ID associated with the advertisement (type: Schema.Types.ObjectId)
 */

/**
 * @param  createdAt - Timestamp of Advertisement creation (type: Date)
 * Description: Timestamp of Advertisement creation.
 */

/**
 * @param  creatorId - Advertisement creator, ref to `User` model
 * Description: Advertisement creator.
 */

/**
 * @param  updatedAt - Timestamp of Advertisement updation (type: Date)
 * Description: Timestamp of Advertisement updation.
 */

/**
 * @param  mediaUrl - media associated with the advertisement (type: String)
 * Description: media associated with the advertisement.
 */

/**
 * @param  type - Type of advertisement (POPUP, MENU, BANNER) (type: String)
 * Description: Type of advertisement (POPUP, MENU, BANNER).
 */

/**
 * @param  startDate - Start date of the advertisement (type: Date)
 * Description: Start date of the advertisement.
 */

/**
 * @param  endDate - End date of the advertisement (type: Date)
 * Description: End date of the advertisement.
 */
const advertisementSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["POPUP", "MENU", "BANNER"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Automatic timestamps for createdAt and updatedAt fields
  },
);

// Ensure uniqueness of combination of organizationId and name
advertisementSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// Add logging middleware for Advertisement schema
createLoggingMiddleware(advertisementSchema, "Advertisement");

/**
 * Retrieves or creates the Advertisement model.
 * Prevents Mongoose OverwriteModelError during testing.
 */
const advertisementModel = (): Model<InterfaceAdvertisement> =>
  model<InterfaceAdvertisement>("Advertisement", advertisementSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Advertisement = (models.Advertisement ||
  advertisementModel()) as ReturnType<typeof advertisementModel>;
