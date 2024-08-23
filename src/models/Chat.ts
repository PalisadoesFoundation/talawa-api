import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceOrganization } from "./Organization";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceChatMessage } from "./ChatMessage";
/**
 * Interface representing a document for direct chat in MongoDB.
 */
export interface InterfaceChat {
  _id: Types.ObjectId;
  isGroup: boolean;
  name: string;
  users: PopulatedDoc<InterfaceUser & Document>[];
  messages: PopulatedDoc<InterfaceChatMessage & Document>[];
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  organization: PopulatedDoc<InterfaceOrganization & Document>;
  status: string;
  admins: PopulatedDoc<InterfaceUser & Document>[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageId: string;
}

/**
 * Mongoose schema for a chat.
 * @param isGroup - Indicates if the chat is a group chat.
 * @param name - Name of the chat if its a group chat.
 * @param users - Users participating in the chat.
 * @param messages - Messages in the chat.
 * @param creatorId - Creator of the chat, reference to `User` model.
 * @param admins - Admins of the chat if its a group chat, reference to `User` model.
 * @param organization - Organization associated with the chat, reference to `Organization` model.
 * @param status - Status of the chat (ACTIVE, BLOCKED, DELETED).
 * @param createdAt - Timestamp of chat creation.
 * @param updatedAt - Timestamp of chat update.
 * @param lastMessageId - ID of the last message in the chat.
 */
const chatSchema = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      require: false,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChatMessage",
      },
    ],
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
    lastMessageId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Add logging middleware for directChatSchema
createLoggingMiddleware(chatSchema, "Chat");

/**
 * Retrieves or creates the Mongoose model for DirectChat.
 * Prevents Mongoose OverwriteModelError during testing.
 */
const chatModel = (): Model<InterfaceChat> =>
  model<InterfaceChat>("Chat", chatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Chat = (models.Chat || chatModel()) as ReturnType<
  typeof chatModel
>;
