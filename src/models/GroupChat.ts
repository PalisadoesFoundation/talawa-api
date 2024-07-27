import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceGroupChatMessage } from "./GroupChatMessage";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for a group chat in the database (MongoDB).
 */
export interface InterfaceGroupChat {
  _id: Types.ObjectId;
  title: string;
  users: PopulatedDoc<InterfaceUser & Document>[];
  messages: PopulatedDoc<InterfaceGroupChatMessage & Document>[];
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
}
/**
 * Mongoose schema definition for a group chat document.
 * Defines how group chat data will be stored in MongoDB.
 *
 * @param title - Title of the group chat.
 * @param users - Users participating in the group chat.
 * @param messages - Messages sent in the group chat.
 * @param creatorId - Creator of the group chat.
 * @param createdAt - Timestamp of creation
 * @param updatedAt - Timestamp of updation
 * @param organization - Organization associated with the group chat.
 * @param status - Status of the group chat.
 */
const groupChatSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true, // At least one user is required
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "GroupChatMessage",
      },
    ],
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"], // Status must be one of these values
      default: "ACTIVE",
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
  },
);

/**
 * Adds logging middleware to the group chat schema.
 * Middleware logs changes to group chat documents.
 */
createLoggingMiddleware(groupChatSchema, "GroupChat");

/**
 * Creates a Mongoose model for the group chat schema.
 * Ensures that we don't create multiple models during testing, which can cause errors.
 *
 * @returns The GroupChat model.
 */
const groupChatModel = (): Model<InterfaceGroupChat> =>
  model<InterfaceGroupChat>("GroupChat", groupChatSchema);

/**
 * Export the GroupChat model.
 * This syntax ensures we don't get an OverwriteModelError while running tests.
 */
export const GroupChat = (models.GroupChat || groupChatModel()) as ReturnType<
  typeof groupChatModel
>;
