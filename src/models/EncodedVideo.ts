import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for an encoded video in MongoDB.
 */
export interface InterfaceEncodedVideo {
  _id: Types.ObjectId;
  fileName: string;
  content: string;
  numberOfUses: number;
}

/**
 * Mongoose schema for an encoded video.
 * @param fileName - Name of the file for the encoded video.
 * @param content - Content of the encoded video.
 * @param numberOfUses - Number of times the encoded video has been used.
 */
const encodedVideoSchema = new Schema({
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
    default: 1, // Default value set to 1 when a new document is created.
  },
});

// Add logging middleware for encodedVideoSchema
createLoggingMiddleware(encodedVideoSchema, "EncodedVideo");

/**
 * Retrieves or creates the Mongoose model for EncodedVideo.
 */
const encodedVideoModel = (): Model<InterfaceEncodedVideo> =>
  model<InterfaceEncodedVideo>("EncodedVideo", encodedVideoSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EncodedVideo = (models.EncodedVideo ||
  encodedVideoModel()) as ReturnType<typeof encodedVideoModel>;
