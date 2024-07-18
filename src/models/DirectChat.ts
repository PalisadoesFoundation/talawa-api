import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceDirectChatMessage } from "./DirectChatMessage";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * Interface representing a document for direct chat in MongoDB.
 */
export interface InterfaceDirectChat {
  _id: Types.ObjectId;
  users: PopulatedDoc<InterfaceUser & Document>[];
  messages: PopulatedDoc<InterfaceDirectChatMessage & Document>[];
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for a direct chat.
 * @param users - Users participating in the chat.
 * @param messages - Messages in the chat.
 * @param creatorId - Creator of the chat, reference to `User` model.
 * @param organization - Organization associated with the chat, reference to `Organization` model.
 * @param status - Status of the chat (ACTIVE, BLOCKED, DELETED).
 * @param createdAt - Timestamp of chat creation.
 * @param updatedAt - Timestamp of chat update.
 */
const directChatSchema = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "DirectChatMessage",
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
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

// Add logging middleware for directChatSchema
createLoggingMiddleware(directChatSchema, "DirectChat");

/**
 * Retrieves or creates the Mongoose model for DirectChat.
 * Prevents Mongoose OverwriteModelError during testing.
 */
const directChatModel = (): Model<InterfaceDirectChat> =>
  model<InterfaceDirectChat>("DirectChat", directChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const DirectChat = (models.DirectChat ||
  directChatModel()) as ReturnType<typeof directChatModel>;
