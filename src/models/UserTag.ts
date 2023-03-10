import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_User } from "./User";
import { Interface_Tag } from "./Tag";

export interface Interface_UserTag {
  _id: Types.ObjectId;
  user: PopulatedDoc<Interface_User & Document>;
  tag: PopulatedDoc<Interface_Tag & Document>;
}

const UserTagSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tag: {
    type: Schema.Types.ObjectId,
    ref: "Tag",
    required: true,
  },
});

UserTagSchema.index({ user: 1, tag: 1 });

const UserTagModel = () => model<Interface_UserTag>("UserTag", UserTagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const UserTag = (models.UserTag || UserTagModel()) as ReturnType<
  typeof UserTagModel
>;
