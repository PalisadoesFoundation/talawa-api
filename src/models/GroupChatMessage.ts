import type { Types, PopulatedDoc, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceGroupChat } from "./GroupChat";
import type { InterfaceUser } from "./User";
/**
 * This is an interface that represents a database(MongoDB) document for Group Chat Message.
 */
export interface InterfaceGroupChatMessage {
  _id: Types.ObjectId;
  groupChatMessageBelongsTo: PopulatedDoc<InterfaceGroupChat & Document>;
  sender: PopulatedDoc<InterfaceUser & Document>;
  createdAt: Date;
  messageContent: string;
  status: string;
}
/**
 * This represents the schema for a `GroupChatMessage`.
 * @param groupChatMessageBelongsTo - This is the association referring to the `GroupChat` model.
 * @param sender - Sender of the message.
 * @param createdAt - Time stamp of data creation.
 * @param messageContent - Content of the message.
 * @param status - Status.
 */
const groupChatMessageSchema = new Schema({
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

const groupChatMessageModel = () =>
  model<InterfaceGroupChatMessage>("GroupChatMessage", groupChatMessageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const GroupChatMessage = (models.GroupChatMessage ||
  groupChatMessageModel()) as ReturnType<typeof groupChatMessageModel>;
