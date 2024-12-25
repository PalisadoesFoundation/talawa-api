import type { Model, Document } from "mongoose";
import mongoose from "mongoose";
// eslint-disable-next-line @typescript-eslint/naming-convention
const { Schema, model, models } = mongoose;
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for sample data in the database (MongoDB).
 */
export interface InterfaceSampleData extends Document {
  documentId: string;
  collectionName:
    | "Organization"
    | "Post"
    | "Event"
    | "Venue"
    | "User"
    | "Plugin"
    | "AppUserProfile";
}

/**
 * Mongoose schema for sample data.
 * Defines the structure of the sample data document stored in MongoDB.
 */
const sampleDataSchema = new Schema<InterfaceSampleData>({
  documentId: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
    enum: [
      "Organization",
      "Post",
      "Event",
      "Venue",
      "User",
      "AppUserProfile",
      "Plugin",
    ],
  },
});

// Create logging middleware for sampleDataSchema
createLoggingMiddleware<InterfaceSampleData>(sampleDataSchema, "SampleData");

/**
 * Function to retrieve or create the Mongoose model for Sample Data.
 * This prevents the OverwriteModelError during testing.
 * @returns The Mongoose model for Sample Data.
 */
const sampleDataModel = (): Model<InterfaceSampleData> =>
  model<InterfaceSampleData>("SampleData", sampleDataSchema);

/**
 * The Mongoose model for Sample Data.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const SampleData = (models.SampleData ||
  sampleDataModel()) as ReturnType<typeof sampleDataModel>;
