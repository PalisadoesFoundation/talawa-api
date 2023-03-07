import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_TagFolder {
  _id: Types.ObjectId;
  organization: PopulatedDoc<Interface_Organization & Document>;
  parent: PopulatedDoc<Interface_TagFolder & Document>;
  title: string;
}

const TagFolderSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "TagFolder",
    required: false,
    default: null, // A null parent corresponds to a root folder in the organization
  },
});

const TagFolderModel = () =>
  model<Interface_TagFolder>("TagFolder", TagFolderSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagFolder = (models.TagFolder || TagFolderModel()) as ReturnType<
  typeof TagFolderModel
>;
