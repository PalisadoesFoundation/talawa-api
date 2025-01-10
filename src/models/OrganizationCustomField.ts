import type { Model } from "mongoose";
import mongoose from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents the structure of an organization custom field in the database.
 */
export interface InterfaceOrganizationCustomField {
  _id: string;
  organizationId: string;
  type: string;
  name: string;
}

/**
 * Mongoose schema definition for OrganizationCustomField documents.
 * @param organizationId - The ID of the organization to which this custom field belongs.
 * @param type - The type of the custom field.
 * @param name - The name of the custom field.
 */
const organizationCustomFieldSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.String,
    ref: "Organization",
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    default: "",
  },
});

/**
 * Middleware to log database operations on the OrganizationCustomField collection.
 */
createLoggingMiddleware(
  organizationCustomFieldSchema,
  "OrganizationCustomField",
);

// Define and export the model directly
const OrganizationCustomField: Model<InterfaceOrganizationCustomField> =
  mongoose.models.CustomField ||
  mongoose.model<InterfaceOrganizationCustomField>(
    "CustomField",
    organizationCustomFieldSchema,
  );

export { OrganizationCustomField };
