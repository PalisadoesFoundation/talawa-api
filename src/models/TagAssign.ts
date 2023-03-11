import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Tag } from "./Tag";

export interface Interface_TagAssign {
  _id: Types.ObjectId;
  objectId: Types.ObjectId;
  tagId: PopulatedDoc<Interface_Tag & Document>;
  objectType: string;
}

const TagAssignSchema = new Schema({
  objectId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  tagId: {
    type: Schema.Types.ObjectId,
    ref: "Tag",
    required: true,
  },
  objectType: {
    type: String,
    required: true,
    enum: ["USER", "EVENT"],
  },
});

TagAssignSchema.index(
  { objectId: 1, tagId: 1, objectType: 1 },
  { unique: true }
);

const TagAssignModel = () =>
  model<Interface_TagAssign>("TagAssign", TagAssignSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagAssign = (models.TagAssign || TagAssignModel()) as ReturnType<
  typeof TagAssignModel
>;
