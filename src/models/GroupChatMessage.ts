import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceGroupChat } from "./GroupChat";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for a group chat message in the database (MongoDB).
 */
export interface InterfaceGroupChatMessage {
  _id: Types.ObjectId;
  groupChatMessageBelongsTo: PopulatedDoc<InterfaceGroupChat & Document>;
  sender: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
  messageContent: string;
  status: string;
}

/**
 * Mongoose schema for a group chat message.
 * Defines the structure of the group chat message document stored in MongoDB.
 * @param groupChatMessageBelongsTo - The association referring to the GroupChat model.
 * @param sender - The sender of the message.
 * @param messageContent - The content of the message.
 * @param status - The status of the message (e.g., ACTIVE, BLOCKED, DELETED).
 * @param createdAt - The date and time when the message was created.
 * @param updatedAt - The date and time when the message was last updated.
 */
const groupChatMessageSchema = new Schema(
  {
    groupChatMessageBelongsTo: {
      type: Schema.Types.ObjectId,
      ref: "GroupChat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Add logging middleware for groupChatMessageSchema
createLoggingMiddleware(groupChatMessageSchema, "GroupChatMessage");

/**
 * Function to retrieve or create the Mongoose model for the GroupChatMessage.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the GroupChatMessage.
 */
const groupChatMessageModel = (): Model<InterfaceGroupChatMessage> =>
  model<InterfaceGroupChatMessage>("GroupChatMessage", groupChatMessageSchema);

/**
 * The Mongoose model for the GroupChatMessage.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const GroupChatMessage = (models.GroupChatMessage ||
  groupChatMessageModel()) as ReturnType<typeof groupChatMessageModel>;
