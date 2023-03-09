import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_TagFolder {
  _id: Types.ObjectId;
  organization: PopulatedDoc<Interface_Organization & Document>;
  parent: PopulatedDoc<Interface_TagFolder & Document>;
  title: string;
}

const validateFolderName = [
  // Check length of the folder name
  {
    validator: function (tag: string) {
      return tag.length <= 50;
    },
    message: ({ value }: { value: string }) =>
      `${value} is not a valid folder name as all tag folders must have a maximum length of 50 characters.`,
  },
  // Check the tag for allowed characters
  {
    validator: function (tag: string) {
      return /^[a-zA-Z0-9_\- ]+$/.test(tag);
    },
    message: ({ value }: { value: string }) =>
      `${value} is not a valid tag folder as it can only have alphabets, digits, dashes, underscores and spaces.`,
  },
];

const TagFolderSchema = new Schema({
  title: {
    type: String,
    required: true,
    validate: validateFolderName,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "TagFolder",
    required: true,
    default: null, // A null parent corresponds to a root folder in the organization
  },
});

TagFolderSchema.index({ organization: 1, parent: 1 }, { unique: true });

const TagFolderModel = () =>
  model<Interface_TagFolder>("TagFolder", TagFolderSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TagFolder = (models.TagFolder || TagFolderModel()) as ReturnType<
  typeof TagFolderModel
>;
