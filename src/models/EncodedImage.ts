import { Schema, model, Types, models } from "mongoose";
/**
 * This is an interface that represents a database(MongoDB) document for Encoded Image.
 */
export interface Interface_EncodedImage {
  _id: Types.ObjectId;
  fileName: string;
  content: string;
  numberOfUses: number;
}
/**
 * This describes the schema for a `encodedImage` that corresponds to `Interface_EncodedImage` document.
 * @param fileName - File name.
 * @param content - Content.
 * @param numberOfUses - Number of Uses.
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

const EncodedImageModel = () =>
  model<Interface_EncodedImage>("EncodedImage", encodedImageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EncodedImage = (models.EncodedImage ||
  EncodedImageModel()) as ReturnType<typeof EncodedImageModel>;
