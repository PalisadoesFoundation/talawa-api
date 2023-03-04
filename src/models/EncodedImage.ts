import { Schema, model, Types, models } from "mongoose";

export interface Interface_EncodedImage {
  _id: Types.ObjectId;
  fileName: string;
  content: string;
  numberOfUses: Number;
}

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
    default: 1,
  },
});

const EncodedImageModel = () =>
  model<Interface_EncodedImage>("EncodedImage", encodedImageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const EncodedImage = (models.EncodedImage ||
  EncodedImageModel()) as ReturnType<typeof EncodedImageModel>;
