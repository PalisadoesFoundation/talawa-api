import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_OrganizationTagUser {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<Interface_Organization & Document>;
  parentTagId: PopulatedDoc<Interface_OrganizationTagUser & Document>;
  name: string;
}

// A User Tag is used for the categorization and the grouping of related users
// Each tag belongs to a particular organization, and is private to the same.
// Each tag can be nested to hold other sub-tags so as to create a heriecheal structure.
const OrganizationTagUserSchema = new Schema({
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
});

OrganizationTagUserSchema.index(
  { organizationId: 1, parentOrganizationTagUserId: 1, name: 1 },
  { unique: true }
);

const OrganizationTagUserModel = () =>
  model<Interface_OrganizationTagUser>(
    "OrganizationTagUser",
    OrganizationTagUserSchema
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const OrganizationTagUser = (models.OrganizationTagUser ||
  OrganizationTagUserModel()) as ReturnType<typeof OrganizationTagUserModel>;
