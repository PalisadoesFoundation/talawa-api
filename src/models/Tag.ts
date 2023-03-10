import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_Tag {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<Interface_Organization & Document>;
  parentTagId: PopulatedDoc<Interface_Tag & Document>;
  name: string;
}

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
