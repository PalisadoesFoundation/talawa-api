import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for an image hash in the database (MongoDB).
 */
export interface InterfaceImageHash {
  _id: Types.ObjectId;
  hashValue: string;
  fileName: string;
  numberOfUses: number;
  status: string;
}

/**
 * Mongoose schema for an image hash.
 * Defines the structure of the image hash document stored in MongoDB.
 * @param hashValue - The hash value of the image.
 * @param fileName - The file name of the image.
 * @param numberOfUses - The number of times the image hash has been used.
 * @param status - The status of the image hash (e.g., ACTIVE, BLOCKED, DELETED).
 */
const imageHashSchema = new Schema({
  hashValue: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  numberOfUses: {
    type: Number,
    default: 0,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
});

// Add logging middleware for imageHashSchema
createLoggingMiddleware(imageHashSchema, "ImageHash");

/**
 * Function to retrieve or create the Mongoose model for the ImageHash.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the ImageHash.
 */
const imageHashModel = (): Model<InterfaceImageHash> =>
  model<InterfaceImageHash>("ImageHash", imageHashSchema);

/**
 * The Mongoose model for the ImageHash.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const ImageHash = (models.ImageHash || imageHashModel()) as ReturnType<
  typeof imageHashModel
>;
