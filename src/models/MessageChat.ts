import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";
/**
 * This is an interface representing a document for a chat in the database(MongoDB).
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
 * This the structure of a chat
 * @param message - Chat message
 * @param languageBarrier - Boolean Type
 * @param sender - Sender
 * @param receiver - Receiver
 * @param createdAt - Date when the chat was created
 * @param updatedAt - Date when the chat was updated
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
    timestamps: true,
  }
);

const messageChatModel = (): Model<InterfaceMessageChat> =>
  model<InterfaceMessageChat>("MessageChat", messageChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const MessageChat = (models.MessageChat ||
  messageChatModel()) as ReturnType<typeof messageChatModel>;
