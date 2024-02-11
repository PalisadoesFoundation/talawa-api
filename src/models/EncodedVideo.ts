import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
/**
 * This is an interface that represents a database(MongoDB) document for Encoded Video.
 */
export interface InterfaceEncodedVideo {
  _id: Types.ObjectId;
  fileName: string;
  content: string;
  numberOfUses: number;
}
/**
 * This describes the schema for a `encodedVideo` that corresponds to `InterfaceEncodedVideo` document.
 * @param fileName - File name.
 * @param content - Content.
 * @param numberOfUses - Number of Uses.
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
    default: 1,
  },
});

const encodedVideoModel = (): Model<InterfaceEncodedVideo> =>
  model<InterfaceEncodedVideo>("EncodedVideo", encodedVideoSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EncodedVideo = (models.EncodedVideo ||
  encodedVideoModel()) as ReturnType<typeof encodedVideoModel>;
