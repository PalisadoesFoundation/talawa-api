import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceDirectChat } from "./DirectChat";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a direct chat message in the database(MongoDB).
 */
export interface InterfaceDirectChatMessage {
  _id: Types.ObjectId;
  directChatMessageBelongsTo: PopulatedDoc<InterfaceDirectChat & Document>;
  sender: PopulatedDoc<InterfaceUser & Document>;
  receiver: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  messageContent: string;
  status: string;
}
/**
 * This is the Structure of the Direct chat Message
 * @param directChatMessageBelongsTo - To whom the direct chat messages belong
 * @param sender - Sender
 * @param receiver - Receiver
 * @param createdAt - Date when the message was created
 * @param messageContent - Message content
 * @param status - whether the message is active, blocked or deleted
 */
const directChatMessageSchema = new Schema({
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
  createdAt: {
    type: Date,
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
});

const directChatMessageModel = (): Model<InterfaceDirectChatMessage> =>
  model<InterfaceDirectChatMessage>(
    "DirectChatMessage",
    directChatMessageSchema
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const DirectChatMessage = (models.DirectChatMessage ||
  directChatMessageModel()) as ReturnType<typeof directChatMessageModel>;
