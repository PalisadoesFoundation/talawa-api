import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { MembershipRequest } from "../../generated/graphqlCodegen";
import { Interface_Message } from "./Message";
import { Interface_Post } from "./Post";
import { Interface_User } from "./User";

/**
 * This is an interface that represents a database(MongoDB) document for Organization.
 */
export interface Interface_Organization {
  _id: Types.ObjectId;
  apiUrl: string | undefined;
  image: string | undefined;
  name: string;
  description: string;
  location: string | undefined;
  isPublic: boolean;
  creator: PopulatedDoc<Interface_User & Document>;
  status: string;
  members: Array<PopulatedDoc<Interface_User & Document>>;
  admins: Array<PopulatedDoc<Interface_User & Document>>;
  groupChats: Array<PopulatedDoc<Interface_Message & Document>>;
  posts: Array<PopulatedDoc<Interface_Post & Document>>;
  membershipRequests: Array<PopulatedDoc<MembershipRequest & Document>>;
  blockedUsers: Array<PopulatedDoc<Interface_User & Document>>;
  visibleInSearch: boolean | undefined;
  tags: Array<string>;
  createdAt: Date;
}

/**
 * This describes the schema for a `Organization` that corresponds to `Interface_Organization` document.
 * @param apiUrl - API URL.
 * @param image - Organization image URL.
 * @param name - Organization name.
 * @param description - Organization description.
 * @param location - Organization location.
 * @param isPublic - Organization visibility.
 * @param creator - Organization creator, referring to `User` model.
 * @param status - Status.
 * @param members - Collection of members, each object refer to `User` model.
 * @param admins - Collection of organization admins, each object refer to `User` model.
 * @param groupChats - Collection of group chats, each object refer to `Message` model.
 * @param posts - Collection of Posts in the Organization, each object refer to `Post` model.
 * @param membershipRequests - Collection of membership requests in the Organization, each object refer to `MembershipRequest` model.
 * @param blockedUsers - Collection of Blocked User in the Organization, each object refer to `User` model.
 * @param tags - Collection of tags.
 * @param createdAt - Time stamp of data creation.
 */
const organizationSchema = new Schema({
  apiUrl: {
    type: String,
  },
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "BLOCKED", "DELETED"],
    default: "ACTIVE",
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  groupChats: [
    {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  membershipRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: "MembershipRequest",
    },
  ],
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  visibleInSearch: {
    type: Boolean,
  },
  tags: [
    {
      type: String,
      required: false,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// creates a model.
const OrganizationModel = () =>
  model<Interface_Organization>("Organization", organizationSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Organization = (models.Organization ||
  OrganizationModel()) as ReturnType<typeof OrganizationModel>;
