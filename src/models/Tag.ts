import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_Tag {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<Interface_Organization & Document>;
  parentTagId: PopulatedDoc<Interface_Tag & Document>;
  name: string;
}

// A tag is used for the categorization and the grouping of related objects (for eg. user)
// Each tag belongs to a particular organization, and is private to the same.
// Each tag can be nested to hold other sub-tags so as to create a heriecheal structure.
const TagSchema = new Schema({
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
    ref: "Tag",
    required: false,
    default: null, // A null parent corresponds to a root tag in the organization
  },
});

TagSchema.index(
  { organizationId: 1, parentTagId: 1, name: 1 },
  { unique: true }
);

const TagModel = () => model<Interface_Tag>("Tag", TagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Tag = (models.Tag || TagModel()) as ReturnType<typeof TagModel>;
