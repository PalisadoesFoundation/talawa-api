import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_User } from "./User";

/**
 * This is an interface representing a document for a chat in the database(MongoDB). 
 */
 
export interface Interface_MessageChat {
  _id: Types.ObjectId;
  message: string;
  languageBarrier: boolean;
  sender: PopulatedDoc<Interface_User & Document>;
  receiver: PopulatedDoc<Interface_User & Document>;
  createdAt: Date;
}

/**
 * This the structure of a chat
 * @param message - Chat message
 * @param languageBarrier - Boolean Type
 * @param sender - Sender
 * @param receiver - Receiver
 * @param createdAt - Date when the chat was created
 */
const messageChatSchema = new Schema({
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
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// create a model.
const MessageChatModel = () =>
  model<Interface_MessageChat>("MessageChat", messageChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const MessageChat = (models.MessageChat ||
  MessageChatModel()) as ReturnType<typeof MessageChatModel>;
