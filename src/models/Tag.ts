import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_TagFolder } from "./TagFolder";
import { Interface_User } from "./User";
import { Interface_Organization } from "./Organization";

export interface Interface_Tag {
  _id: Types.ObjectId;
  folder: PopulatedDoc<Interface_TagFolder & Document>;
  organization: PopulatedDoc<Interface_Organization & Document>;
  title: string;
  users: Array<PopulatedDoc<Interface_User & Document>>;
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
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  folder: {
    type: Schema.Types.ObjectId,
    ref: "TagFolder",
    required: true,
  },
  title: {
    type: String,
    required: true,
    validate: validateTagName,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

TagSchema.index({ organization: 1 });

const TagModel = () => model<Interface_Tag>("Tag", TagSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Tag = (models.Tag || TagModel()) as ReturnType<typeof TagModel>;
