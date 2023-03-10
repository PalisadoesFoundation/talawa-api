import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_User } from "./User";
import { Interface_Tag } from "./Tag";

export interface Interface_TagUser {
  _id: Types.ObjectId;
  userId: PopulatedDoc<Interface_User & Document>;
  tagId: PopulatedDoc<Interface_Tag & Document>;
}

const TagUserSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tagId: {
    type: Schema.Types.ObjectId,
    ref: "Tag",
    required: true,
  },
});

TagUserSchema.index({ userId: 1, tagId: 1 }, { unique: true });

const TagUserModel = () => model<Interface_TagUser>("TagUser", TagUserSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagUser = (models.TagUser || TagUserModel()) as ReturnType<
  typeof TagUserModel
>;
