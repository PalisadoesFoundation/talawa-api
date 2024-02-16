import type { Model } from "mongoose";
import mongoose from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceOrganizationCustomField {
  _id: string;
  organizationId: string;
  type: string;
  name: string;
}

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

createLoggingMiddleware(
  organizationCustomFieldSchema,
  "OrganizationCustomField"
);

// Define and export the model directly
const OrganizationCustomField: Model<InterfaceOrganizationCustomField> =
  mongoose.models.CustomField ||
  mongoose.model<InterfaceOrganizationCustomField>(
    "CustomField",
    organizationCustomFieldSchema
  );

export { OrganizationCustomField };
