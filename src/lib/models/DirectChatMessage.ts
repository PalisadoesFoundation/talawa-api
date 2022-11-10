import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_DirectChat } from "./DirectChat";
import { Interface_User } from "./User";
/**
 * This is an interface representing a document for a direct chat message in the database(MongoDB). 
 */
export interface Interface_DirectChatMessage {
  _id: Types.ObjectId;
  directChatMessageBelongsTo: PopulatedDoc<Interface_DirectChat & Document>;
  sender: PopulatedDoc<Interface_User & Document>;
  receiver: PopulatedDoc<Interface_User & Document>;
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

const DirectChatMessageModel = () =>
  model<Interface_DirectChatMessage>(
    "DirectChatMessage",
    directChatMessageSchema
  );

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const DirectChatMessage = (models.DirectChatMessage ||
  DirectChatMessageModel()) as ReturnType<typeof DirectChatMessageModel>;
