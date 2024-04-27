import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganizationTagUser } from "./OrganizationTagUser";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceTagUser {
  _id: Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  tagId: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
  tagColor: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
}

// Relational schema used to keep track of assigned tags to users
const tagUserSchema = new Schema({
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
  tagColor: {
    type: String,
    required: false,
    defaultValue: "#000000",
  },
});

tagUserSchema.index({ userId: 1, tagId: 1 }, { unique: true });

createLoggingMiddleware(tagUserSchema, "TagUser");

const tagUserModel = (): Model<InterfaceTagUser> =>
  model<InterfaceTagUser>("TagUser", tagUserSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagUser = (models.TagUser || tagUserModel()) as ReturnType<
  typeof tagUserModel
>;
