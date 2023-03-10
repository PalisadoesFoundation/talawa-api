import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";

export interface Interface_Tag {
  _id: Types.ObjectId;
  organizationId: PopulatedDoc<Interface_Organization & Document>;
  parentTagId: PopulatedDoc<Interface_Tag & Document>;
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
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  parentTagId: {
    type: Schema.Types.ObjectId,
    ref: "Tag",
    required: true,
    default: null, // A null parent corresponds to a root tag in the organization
  },
});

TagSchema.index({ organizationId: 1, parentTagId: 1 });

const TagModel = () => model<Interface_Tag>("Tag", TagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Tag = (models.Tag || TagModel()) as ReturnType<typeof TagModel>;
