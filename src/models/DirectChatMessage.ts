import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceDirectChat } from "./DirectChat";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Represents a document for a direct chat message in the MongoDB database.
 */
export interface InterfaceDirectChatMessage {
  _id: Types.ObjectId;
  directChatMessageBelongsTo: PopulatedDoc<InterfaceDirectChat & Document>;
  sender: PopulatedDoc<InterfaceUser & Document>;
  receiver: PopulatedDoc<InterfaceUser & Document>;
  replyTo: PopulatedDoc<InterfaceDirectChatMessage & Document>;
  messageContent: string;
  status: string;
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
const directChatMessageSchema = new Schema(
  {
    directChatMessageBelongsTo: {
      type: Schema.Types.ObjectId,
      ref: "DirectChat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "DirectChatMessage",
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
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Apply logging middleware to the schema
createLoggingMiddleware(directChatMessageSchema, "DirectChatMessage");

/**
 * Returns the Mongoose Model for DirectChatMessage to prevent OverwriteModelError.
 */
const directChatMessageModel = (): Model<InterfaceDirectChatMessage> =>
  model<InterfaceDirectChatMessage>(
    "DirectChatMessage",
    directChatMessageSchema,
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const DirectChatMessage = (models.DirectChatMessage ||
  directChatMessageModel()) as ReturnType<typeof directChatMessageModel>;
