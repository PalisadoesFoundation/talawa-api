import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { MONGOOSE_ORGANIZATION_ERRORS } from "../constants";
import { Interface_MembershipRequest } from "./MembershipRequest";
import { Interface_Message } from "./Message";
import { Interface_Post } from "./Post";
import { Interface_User } from "./User";

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
  pinnedPosts: Array<PopulatedDoc<Interface_Post & Document>>;
  membershipRequests: Array<
    PopulatedDoc<Interface_MembershipRequest & Document>
  >;
  blockedUsers: Array<PopulatedDoc<Interface_User & Document>>;
  visibleInSearch: boolean | undefined;
  tags: Array<string>;
  createdAt: Date;
}

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
    trim: true,
    maxLength: [256, MONGOOSE_ORGANIZATION_ERRORS.NAME_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_ORGANIZATION_ERRORS.NAME_ERRORS.regexError,
    ],
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: [
      500,
      MONGOOSE_ORGANIZATION_ERRORS.DESCRIPTION_ERRORS.lengthError,
    ],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_ORGANIZATION_ERRORS.DESCRIPTION_ERRORS.regexError,
    ],
  },
  location: {
    type: String,
    trim: true,
    maxLength: [50, MONGOOSE_ORGANIZATION_ERRORS.LOCATION_ERRORS.lengthError],
    match: [
      /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
      MONGOOSE_ORGANIZATION_ERRORS.LOCATION_ERRORS.regexError,
    ],
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
  pinnedPosts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: [],
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
      maxLength: [256, MONGOOSE_ORGANIZATION_ERRORS.TAGS_ERRORS.lengthError],
      match: [
        /^[a-zA-Z0-9!@#$%^&*()_\-+. ,]+$/,
        MONGOOSE_ORGANIZATION_ERRORS.TAGS_ERRORS.regexError,
      ],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OrganizationModel = () =>
  model<Interface_Organization>("Organization", organizationSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Organization = (models.Organization ||
  OrganizationModel()) as ReturnType<typeof OrganizationModel>;
