import { Schema, model, Types, models } from "mongoose";
/**
 * This is an interface that represents a database(MongoDB) document for Image Hash.
 */
export interface InterfaceImageHash {
  _id: Types.ObjectId;
  hashValue: string;
  fileName: string;
  numberOfUses: number;
  status: string;
}
/**
 * This represents the schema for an `ImageHash`.
 * @param hashValue - Hash value of an image. `type: String`
 * @param fileName - Image file name.
 * @param numberOfUses - Number of times used.
 * @param status - Status.
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

const imageHashModel = () =>
  model<InterfaceImageHash>("ImageHash", imageHashSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ImageHash = (models.ImageHash || imageHashModel()) as ReturnType<
  typeof imageHashModel
>;
