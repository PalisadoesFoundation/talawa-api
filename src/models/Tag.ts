import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_TagFolder } from "./TagFolder";

export interface Interface_Tag {
  _id: Types.ObjectId;
  folder: PopulatedDoc<Interface_TagFolder & Document>;
  title: string;
}

const validateTagName = [
  // Check length of the tag
  {
    validator: function (tag: string) {
      return tag.length <= 30;
    },
    message: ({ value }: { value: string }) =>
      `${value} is not a valid tag as all tags must have a maximum length of 30 characters.`,
  },
  // Check the tag for allowed characters
  {
    validator: function (tag: string) {
      return /^[a-zA-Z0-9_\- ]+$/.test(tag);
    },
    message: ({ value }: { value: string }) =>
      `${value} is not a valid tag as a tag can only have alphabets, digits, dashes, underscores and spaces.`,
  },
];

const TagSchema = new Schema({
  folder: {
    type: Schema.Types.ObjectId,
    ref: "TagFolder",
  },
  title: {
    type: String,
    validate: validateTagName,
  },
});

const TagModel = () => model<Interface_Tag>("Tag", TagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Tag = (models.Tag || TagModel()) as ReturnType<typeof TagModel>;
