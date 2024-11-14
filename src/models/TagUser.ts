import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganizationTagUser } from "./OrganizationTagUser";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a MongoDB document for TagUser in the database.
 */
export interface InterfaceTagUser {
  _id: Types.ObjectId;
  userId: PopulatedDoc<InterfaceUser & Document>;
  tagId: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
  tagColor: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
}
/**
 * Mongoose schema definition for TagUser documents.
 * @param userId - Reference to the user associated with the tag.
 * @param tagId - Reference to the tag associated with the user.
 * @param tagColor - Color associated with the tag.
 */
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
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  tagColor: {
    type: String,
    required: false,
    defaultValue: "#000000",
  },
});

// Ensure uniqueness of tag assignments per user
tagUserSchema.index({ userId: 1, tagId: 1 }, { unique: true });

// Middleware to log database operations on the TagUser collection
createLoggingMiddleware(tagUserSchema, "TagUser");

// Define and export the model directly
const tagUserModel = (): Model<InterfaceTagUser> =>
  model<InterfaceTagUser>("TagUser", tagUserSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagUser = (models.TagUser || tagUserModel()) as ReturnType<
  typeof tagUserModel
>;
