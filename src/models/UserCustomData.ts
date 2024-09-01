import type { Model } from "mongoose";
import mongoose, { model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for custom field in the database (MongoDB).
 */
export interface InterfaceUserCustomData {
  _id: string;
  organizationId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any;
  userId: string;
}

/**
 * This is the structure of the User Custom Data
 * @param organizationId - The id of the organization to which the user belongs.
 * @param userId - The id of the user
 * @param values - The values of the demographic detail
 */

const userCustomDataSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.String,
    ref: "Organization",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.String,
    ref: "User",
    required: true,
  },
  values: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
});

// Create logging middleware for userCustomDataSchema
createLoggingMiddleware(userCustomDataSchema, "UserCustomData");

/**
 * Function to retrieve or create the Mongoose model for User Custom Data.
 * This prevents the OverwriteModelError during testing.
 * @returns The Mongoose model for User Custom Data.
 */
const userCustomData = (): Model<InterfaceUserCustomData> =>
  model<InterfaceUserCustomData>("UserCustomData", userCustomDataSchema);

/**
 * The Mongoose model for User Custom Data.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const UserCustomData = (models.UserCustomData ||
  userCustomData()) as ReturnType<typeof userCustomData>;
