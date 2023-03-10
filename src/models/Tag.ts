import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_Tag {
  _id: Types.ObjectId;
  organization: PopulatedDoc<Interface_Organization & Document>;
  parentTag: PopulatedDoc<Interface_Tag & Document>;
  title: string;
}

const validateTagName = [
  // Check length of the folder name
  {
    validator: function (tag: string) {
      return tag.length <= 30;
    },
    message: ({ value }: { value: string }) =>
      `${value} is not a valid atg name as all tag must have a maximum length of 30 characters.`,
  },
  // Check the tag for allowed characters
  {
    validator: function (tag: string) {
      return /^[a-zA-Z0-9_\- ]+$/.test(tag);
    },
    message: ({ value }: { value: string }) =>
      `${value} is not a valid tag as it can only have alphabets, digits, dashes, underscores and spaces.`,
  },
];

const TagSchema = new Schema({
  title: {
    type: String,
    required: true,
    validate: validateTagName,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  parentTag: {
    type: Schema.Types.ObjectId,
    ref: "Tag",
    required: false,
    default: null, // A null parent corresponds to a root tag in the organization
  },
});

TagSchema.index({ organization: 1, parentTag: 1 });

const TagModel = () => model<Interface_Tag>("Tag", TagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Tag = (models.Tag || TagModel()) as ReturnType<typeof TagModel>;
