import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * Interface representing a document for a chat in the database (MongoDB).
 */
export interface InterfaceMessageChat {
  _id: Types.ObjectId;
  message: string;
  languageBarrier: boolean;
  sender: PopulatedDoc<InterfaceUser & Document>;
  receiver: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  updatedAt: Date;
}
/**
 * Mongoose schema for a Message Chat.
 * Defines the structure of the Message Chat document stored in MongoDB.
 * @param message - The content of the chat message.
 * @param languageBarrier - Indicates if there's a language barrier in the chat.
 * @param sender - Reference to the User who sent the chat message.
 * @param receiver - Reference to the User who received the chat message.
 * @param createdAt - The date and time when the chat was created.
 * @param updatedAt - The date and time when the chat was last updated.
 */
const messageChatSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    languageBarrier: {
      type: Boolean,
      required: false,
      default: false,
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
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Add logging middleware for messageChatSchema
createLoggingMiddleware(messageChatSchema, "MessageChat");

/**
 * Function to retrieve or create the Mongoose model for the MessageChat.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the MessageChat.
 */
const messageChatModel = (): Model<InterfaceMessageChat> =>
  model<InterfaceMessageChat>("MessageChat", messageChatSchema);

/**
 * The Mongoose model for the MessageChat.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const MessageChat = (models.MessageChat ||
  messageChatModel()) as ReturnType<typeof messageChatModel>;
