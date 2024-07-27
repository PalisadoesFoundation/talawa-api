import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a document for an encoded image in the MongoDB database.
 */
export interface InterfaceEncodedImage {
  _id: Types.ObjectId;
  fileName: string;
  content: string;
  numberOfUses: number;
}

/**
 * Mongoose schema definition for an encoded image document.
 * @param fileName - File name of the encoded image.
 * @param content - Content of the encoded image.
 * @param numberOfUses - Number of times the encoded image has been used.
 */
const encodedImageSchema = new Schema({
  fileName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  numberOfUses: {
    type: Number,
    required: true,
    default: 1,
  },
});

// Apply logging middleware to the schema
createLoggingMiddleware(encodedImageSchema, "EncodedImage");

const encodedImageModel = (): Model<InterfaceEncodedImage> =>
  model<InterfaceEncodedImage>("EncodedImage", encodedImageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EncodedImage = (models.EncodedImage ||
  encodedImageModel()) as ReturnType<typeof encodedImageModel>;
