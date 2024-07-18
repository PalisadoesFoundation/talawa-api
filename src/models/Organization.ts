import type { Document, Model, PopulatedDoc, Types } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceFund } from "./Fund";
import type { InterfaceMembershipRequest } from "./MembershipRequest";
import type { InterfaceMessage } from "./Message";
import type { InterfaceOrganizationCustomField } from "./OrganizationCustomField";
import type { InterfacePost } from "./Post";
import type { InterfaceUser } from "./User";
import type { InterfaceAdvertisement } from "./Advertisement";

/**
 * Interface representing a document for an Organization in the database (MongoDB).
 */
export interface InterfaceOrganization {
  _id: Types.ObjectId;
  apiUrl: string | undefined;
  image: string | undefined;
  name: string;
  description: string;
  address: {
    city: string;
    countryCode: string;
    dependentLocality: string;
    line1: string;
    line2: string;
    postalCode: string;
    sortingCode: string;
    state: string;
  };
  advertisements: PopulatedDoc<InterfaceAdvertisement & Document>;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  status: string;
  members: PopulatedDoc<InterfaceUser & Document>[];
  admins: PopulatedDoc<InterfaceUser & Document>[];
  groupChats: PopulatedDoc<InterfaceMessage & Document>[];
  posts: PopulatedDoc<InterfacePost & Document>[];
  pinnedPosts: PopulatedDoc<InterfacePost & Document>[];
  membershipRequests: PopulatedDoc<InterfaceMembershipRequest & Document>[];
  blockedUsers: PopulatedDoc<InterfaceUser & Document>[];
  customFields: PopulatedDoc<InterfaceOrganizationCustomField & Document>[];
  createdAt: Date;
  updatedAt: Date;
  userRegistrationRequired: boolean;
  funds: PopulatedDoc<InterfaceFund & Document>[];
  visibleInSearch: boolean;
}

/**
 * Mongoose schema for an Organization.
 * Defines the structure of the Organization document stored in MongoDB.
 * @param apiUrl - API URL associated with the organization.
 * @param image - URL of the organization's image.
 * @param name - Name of the organization.
 * @param description - Description of the organization.
 * @param address - Address details of the organization.
 * @param creatorId - Creator of the organization, referencing the User model.
 * @param status - Status of the organization.
 * @param members - Collection of members in the organization, each object referencing the User model.
 * @param admins - Collection of admins in the organization, each object referencing the User model.
 * @param advertisements - Collection of advertisements associated with the organization, each object referencing the Advertisement model.
 * @param groupChats - Collection of group chats associated with the organization, each object referencing the Message model.
 * @param posts - Collection of posts associated with the organization, each object referencing the Post model.
 * @param pinnedPosts - Collection of pinned posts associated with the organization, each object referencing the Post model.
 * @param membershipRequests - Collection of membership requests associated with the organization, each object referencing the MembershipRequest model.
 * @param blockedUsers - Collection of blocked users associated with the organization, each object referencing the User model.
 * @param customFields - Collection of custom fields associated with the organization, each object referencing the OrganizationCustomField model.
 * @param funds - Collection of funds associated with the organization, each object referencing the Fund model.
 * @param createdAt - Timestamp of when the organization was created.
 * @param updatedAt - Timestamp of when the organization was last updated.
 * @param userRegistrationRequired - Indicates if user registration is required for the organization.
 * @param visibleInSearch - Indicates if the organization should be visible in search results.
 */
const organizationSchema = new Schema(
  {
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
    address: {
      city: {
        type: String,
      },
      countryCode: {
        type: String,
      },
      dependentLocality: {
        type: String,
      },
      line1: {
        type: String,
      },
      line2: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      sortingCode: {
        type: String,
      },
      state: {
        type: String,
      },
    },
    userRegistrationRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    visibleInSearch: {
      type: Boolean,
      default: true,
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
    adverisements: [
      {
        type: Schema.Types.ObjectId,
        ref: "Advertisement",
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
    customFields: [
      {
        type: Schema.Types.ObjectId,
        ref: "CustomField",
      },
    ],
    funds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Fund",
      },
    ],
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Add logging middleware for organizationSchema
createLoggingMiddleware(organizationSchema, "Organization");

/**
 * Function to retrieve or create the Mongoose model for the Organization.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the Organization.
 */
const organizationModel = (): Model<InterfaceOrganization> =>
  model<InterfaceOrganization>("Organization", organizationSchema);

/**
 * The Mongoose model for the Organization.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const Organization = (models.Organization ||
  organizationModel()) as ReturnType<typeof organizationModel>;
