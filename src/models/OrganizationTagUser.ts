import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for an Organization Tag User in the database (MongoDB).
 */
export interface InterfaceOrganizationTagUser {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  parentTagId: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
  name: string;
  tagColor: string;
}

/**
 * Mongoose schema for an Organization Tag User.
 * Defines the structure of the Organization Tag User document stored in MongoDB.
 * @param name - Name of the organization tag user.
 * @param organizationId - Reference to the organization to which the tag belongs.
 * @param parentTagId - Reference to the parent tag (if any) for hierarchical organization.
 * @param tagColor - Color associated with the tag.
 */
const organizationTagUserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  parentTagId: {
    type: Schema.Types.ObjectId,
    ref: "OrganizationTagUser",
    required: false,
    default: null, // A null parent corresponds to a root tag in the organization
  },
  tagColor: {
    type: String,
    required: false,
    default: "#000000",
  },
});

// Define partial indexes to enforce the unique constraints
// two tags at the same level can't have the same name
organizationTagUserSchema.index(
  { organizationId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { parentTagId: { $eq: null } },
  },
);

organizationTagUserSchema.index(
  { organizationId: 1, parentTagId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { parentTagId: { $ne: null } },
  },
);

// Add logging middleware for organizationTagUserSchema
createLoggingMiddleware(organizationTagUserSchema, "OrganizationTagUser");

/**
 * Function to retrieve or create the Mongoose model for the Organization Tag User.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the Organization Tag User.
 */
const organizationTagUserModel = (): Model<InterfaceOrganizationTagUser> =>
  model<InterfaceOrganizationTagUser>(
    "OrganizationTagUser",
    organizationTagUserSchema,
  );

/**
 * The Mongoose model for the Organization Tag User.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const OrganizationTagUser = (models.OrganizationTagUser ||
  organizationTagUserModel()) as ReturnType<typeof organizationTagUserModel>;
