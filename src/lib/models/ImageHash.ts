import { Schema, model, Types, models } from "mongoose";

export interface Interface_ImageHash {
  _id: Types.ObjectId;
  hashValue: string;
  fileName: string;
  numberOfUses: number;
  status: string;
}

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

const ImageHashModel = () =>
  model<Interface_ImageHash>("ImageHash", imageHashSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ImageHash = (models.ImageHash || ImageHashModel()) as ReturnType<
  typeof ImageHashModel
>;
