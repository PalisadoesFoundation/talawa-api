import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceOrganizationTagUser {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  parentTagId: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
  name: string;
  tagColor: string;
}

// A User Tag is used for the categorization and the grouping of related users
// Each tag belongs to a particular organization, and is private to the same.
// Each tag can be nested to hold other sub-tags so as to create a heriecheal structure.
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

organizationTagUserSchema.index(
  { organizationId: 1, parentOrganizationTagUserId: 1, name: 1 },
  { unique: true },
);

createLoggingMiddleware(organizationTagUserSchema, "OrganizationTagUser");

const organizationTagUserModel = (): Model<InterfaceOrganizationTagUser> =>
  model<InterfaceOrganizationTagUser>(
    "OrganizationTagUser",
    organizationTagUserSchema,
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const OrganizationTagUser = (models.OrganizationTagUser ||
  organizationTagUserModel()) as ReturnType<typeof organizationTagUserModel>;
