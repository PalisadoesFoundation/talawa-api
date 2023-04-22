import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { InterfaceOrganization } from "./Organization";

export interface InterfaceOrganizationTagUser {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<InterfaceOrganization & Document>;
  parentTagId: PopulatedDoc<InterfaceOrganizationTagUser & Document>;
  name: string;
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
});

organizationTagUserSchema.index(
  { organizationId: 1, parentOrganizationTagUserId: 1, name: 1 },
  { unique: true }
);

const organizationTagUserModel = () =>
  model<InterfaceOrganizationTagUser>(
    "OrganizationTagUser",
    organizationTagUserSchema
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const OrganizationTagUser = (models.OrganizationTagUser ||
  organizationTagUserModel()) as ReturnType<typeof organizationTagUserModel>;
