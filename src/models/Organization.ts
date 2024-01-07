import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceMembershipRequest } from "./MembershipRequest";
import type { InterfaceMessage } from "./Message";
import type { InterfacePost } from "./Post";
import type { InterfaceUser } from "./User";
import type { InterfaceOrganizationCustomField } from "./OrganizationCustomField";
/**
 * This is an interface that represents a database(MongoDB) document for Organization.
 */
export interface InterfaceOrganization {
  _id: Types.ObjectId;
  apiUrl: string | undefined;
  image: string | undefined;
  name: string;
  description: string;
  location: string | undefined;
  isPublic: boolean;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  status: string;
  members: PopulatedDoc<InterfaceUser & Document>[];
  admins: PopulatedDoc<InterfaceUser & Document>[];
  groupChats: PopulatedDoc<InterfaceMessage & Document>[];
  posts: PopulatedDoc<InterfacePost & Document>[];
  pinnedPosts: PopulatedDoc<InterfacePost & Document>[];
  membershipRequests: PopulatedDoc<InterfaceMembershipRequest & Document>[];
  blockedUsers: PopulatedDoc<InterfaceUser & Document>[];
  visibleInSearch: boolean | undefined;
  customFields: PopulatedDoc<InterfaceOrganizationCustomField & Document>[];
  createdAt: Date;
  updatedAt: Date;
}
/**
 * This describes the schema for a `Organization` that corresponds to `InterfaceOrganization` document.
 * @param apiUrl - API URL.
 * @param image - Organization image URL.
 * @param name - Organization name.
 * @param description - Organization description.
 * @param location - Organization location.
 * @param isPublic - Organization visibility.
 * @param creatorId - Organization creator, referring to `User` model.
 * @param status - Status.
 * @param members - Collection of members, each object refer to `User` model.
 * @param admins - Collection of organization admins, each object refer to `User` model.
 * @param groupChats - Collection of group chats, each object refer to `Message` model.
 * @param posts - Collection of Posts in the Organization, each object refer to `Post` model.
 * @param membershipRequests - Collection of membership requests in the Organization, each object refer to `MembershipRequest` model.
 * @param blockedUsers - Collection of Blocked User in the Organization, each object refer to `User` model.
 * @param tags - Collection of tags.
 * @param createdAt - Time stamp of data creation.
 * @param updatedAt - Time stamp of data updation.
 */
const organizationSchema = new Schema(
  {
    apiUrl: {
      type: String,
      required: true,
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
    creatorId: {
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
      required: true,
    },
    customFields: [
      {
        type: Schema.Types.ObjectId,
        ref: "CustomField",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const organizationModel = (): Model<InterfaceOrganization> =>
  model<InterfaceOrganization>("Organization", organizationSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Organization = (models.Organization ||
  organizationModel()) as ReturnType<typeof organizationModel>;
