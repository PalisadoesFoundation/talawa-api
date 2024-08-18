import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
import type { InterfaceChat } from "./Chat";

/**
 * Represents a document for a direct chat message in the MongoDB database.
 */
export interface InterfaceChatMessage {
  _id: Types.ObjectId;
  chatMessageBelongsTo: PopulatedDoc<InterfaceChat & Document>;
  sender: PopulatedDoc<InterfaceUser & Document>;
  replyTo: PopulatedDoc<InterfaceChatMessage & Document>;
  messageContent: string;
  type: string;
  status: string;
  deletedBy: PopulatedDoc<InterfaceUser & Document>[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for a direct chat message document.
 * @param directChatMessageBelongsTo - Reference to the direct chat session to which the message belongs.
 * @param sender - Reference to the user who sent the message.
 * @param receiver - Reference to the user who received the message.
 * @param messageContent - Content of the direct chat message.
 * @param status - Status of the message (ACTIVE, BLOCKED, DELETED).
 * @param createdAt - Date when the direct chat message was created.
 * @param updatedAt - Date when the direct chat message was last updated.
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
    type: {
      type: String,
      required: true,
      enum: ["STRING", "VIDEO", "IMAGE", "FILE"],
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
