import { Schema, Types, model, PopulatedDoc, Document, models } from "mongoose";
import { Interface_GroupChat } from "./GroupChat";
import { Interface_User } from "./User";

export interface Interface_GroupChatMessage {
  _id: Types.ObjectId;
  groupChatMessageBelongsTo: PopulatedDoc<Interface_GroupChat & Document>;
  sender: PopulatedDoc<Interface_User & Document>;
  createdAt: Date;
  messageContent: string;
  status: string;
}

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

const GroupChatMessageModel = () =>
  model<Interface_GroupChatMessage>("GroupChatMessage", groupChatMessageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const GroupChatMessage = (models.GroupChatMessage ||
  GroupChatMessageModel()) as ReturnType<typeof GroupChatMessageModel>;
