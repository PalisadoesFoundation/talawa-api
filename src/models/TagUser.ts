import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_OrganizationTagUser } from "./OrganizationTagUser";
import { Interface_User } from "./User";

export interface Interface_TagUser {
  _id: Types.ObjectId;
  userId: PopulatedDoc<Interface_User & Document>;
  tagId: PopulatedDoc<Interface_OrganizationTagUser & Document>;
}

const TagUserSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  tagId: {
    type: Schema.Types.ObjectId,
    ref: "OrganizationTagUser",
    required: true,
  },
});

TagUserSchema.index({ userId: 1, tagId: 1 }, { unique: true });

const TagUserModel = () => model<Interface_TagUser>("TagUser", TagUserSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagUser = (models.TagUser || TagUserModel()) as ReturnType<
  typeof TagUserModel
>;
