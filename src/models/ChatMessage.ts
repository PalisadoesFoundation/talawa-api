import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceChat } from "./Chat";

/**
 * Represents a document for a chat message in the MongoDB database.
 */
export interface InterfaceChatMessage {
  _id: Types.ObjectId;
  chatMessageBelongsTo: PopulatedDoc<InterfaceChat & Document>;
  sender: PopulatedDoc<InterfaceUser & Document>;
  replyTo: PopulatedDoc<InterfaceChatMessage & Document>;
  messageContent: string;
  status: string;
  deletedBy: PopulatedDoc<InterfaceUser & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ChatMessage Schema
 *
 * This schema defines the structure of a chat message document in the database.
 *
 * Fields:
 * - chatMessageBelongsTo: ObjectId, ref: "Chat", required
 *   - The chat to which this message belongs.
 * - sender: ObjectId, ref: "User", required
 *   - The user who sent the message.
 * - replyTo: ObjectId, ref: "ChatMessage", optional
 *   - The message to which this message is a reply.
 * - messageContent: String, required
 *   - The content of the message.
 * - type: String, required, enum: ["STRING", "VIDEO", "IMAGE", "FILE"]
 *   - The type of the message content.
 * - status: String, required, enum: ["ACTIVE", "BLOCKED", "DELETED"], default: "ACTIVE"
 *   - The status of the message.
 * - deletedBy: Array of ObjectId, ref: "User", optional
 *   - List of users who have deleted the message.
 * - updatedAt: Date, required
 *   - The date when the message was last updated.
 * - createdAt: Date, required
 *   - The date when the message was created.
 *
 * Options:
 * - timestamps: Automatically adds createdAt and updatedAt fields.
 */
const chatMessageSchema = new Schema(
  {
    chatMessageBelongsTo: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
      required: false,
    },
    messageContent: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    updatedAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Apply logging middleware to the schema
createLoggingMiddleware(chatMessageSchema, "DirectChatMessage");

/**
 * Returns the Mongoose Model for DirectChatMessage to prevent OverwriteModelError.
 */
const chatMessageModel = (): Model<InterfaceChatMessage> =>
  model<InterfaceChatMessage>("ChatMessage", chatMessageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const ChatMessage = (models.ChatMessage ||
  chatMessageModel()) as ReturnType<typeof chatMessageModel>;
