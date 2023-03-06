import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_Organization } from "./Organization";
import { Interface_User } from "./User";

export interface Interface_UserOrgTags {
  _id: Types.ObjectId;
  user: PopulatedDoc<Interface_User & Document>;
  organization: PopulatedDoc<Interface_Organization & Document>;
  tags: Array<string>;
}

const userOrgTagsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
  },
  tags: [
    {
      type: String,
      // Test that each individual tag should not be more than 25 characters in length
      validate: {
        validator: function (v: string) {
          return v.length <= 25;
        },
        message: ({ value }: { value: string }) =>
          `${value} is not a valid tag as all tags must have a maximum length of 25 characters.`,
      },
    },
  ],
});

// Test that all the tags should be unique
userOrgTagsSchema.path("tags").validate(function (tags: string[]) {
  return new Set(tags).size === tags.length;
}, "The tags must be unique.");

// Test that all the tag count should not exceed 10
userOrgTagsSchema.path("tags").validate(function (tags: string[]) {
  return tags.length <= 10;
}, "A user can't have more than 10 tags for a particular organization.");

// Create a compound index on user and organization for faster querying
userOrgTagsSchema.index({ user: 1, organization: -1 }, { unique: true });

const UserOrgTagsModel = () =>
  model<Interface_UserOrgTags>("UserOrgTags", userOrgTagsSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const UserOrgTags = (models.UserOrgTags ||
  UserOrgTagsModel()) as ReturnType<typeof UserOrgTagsModel>;
