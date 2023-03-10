import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_User } from "./User";
import { Interface_Tag } from "./Tag";

export interface Interface_UserTag {
  _id: Types.ObjectId;
  userId: PopulatedDoc<Interface_User & Document>;
  tagId: PopulatedDoc<Interface_Tag & Document>;
}

const UserTagSchema = new Schema({
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

UserTagSchema.index({ userId: 1, tagId: 1 });

const UserTagModel = () => model<Interface_UserTag>("UserTag", UserTagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const UserTag = (models.UserTag || UserTagModel()) as ReturnType<
  typeof UserTagModel
>;
