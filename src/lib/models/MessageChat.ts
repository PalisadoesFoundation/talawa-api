import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_User } from "./User";

/**
 * This is an interface that represents a database(MongoDB) document for MessageChat.
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
 * This describes the schema for a `MessageChat` that corresponds to `Interface_MessageChat` document.
 * @param message - Message content.
 * @param languageBarrier - Language check of the message.
 * @param sender - Message Sender(User), referring to `User` model.
 * @param receiver - Message Receiver(User), referring to `User` model.
 * @param createdAt - Time stamp of data creation.
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
