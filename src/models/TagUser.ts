import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceOrganizationTagUser } from "./OrganizationTagUser";
import { InterfaceUser } from "./User";

export interface InterfaceTagUser {
  _id: Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  tagId: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
}

// Relational schema used to keep track of assigned tags to users
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

const TagUserModel = () => model<InterfaceTagUser>("TagUser", TagUserSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagUser = (models.TagUser || TagUserModel()) as ReturnType<
  typeof TagUserModel
>;
