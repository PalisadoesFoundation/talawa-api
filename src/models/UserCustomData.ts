import type { Model } from "mongoose";
import mongoose, { model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * This is an interface representing a document for custom field in the database(MongoDB).
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

createLoggingMiddleware(userCustomDataSchema, "UserCustomData");

const userCustomData = (): Model<InterfaceUserCustomData> =>
  model<InterfaceUserCustomData>("UserCustomData", userCustomDataSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const UserCustomData = (models.UserCustomData ||
  userCustomData()) as ReturnType<typeof userCustomData>;
