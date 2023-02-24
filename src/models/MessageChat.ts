import { Schema, model, PopulatedDoc, Types, Document, models } from "mongoose";
import { Interface_User } from "./User";
import dayjs from "dayjs";

export interface Interface_MessageChat {
  _id: Types.ObjectId;
  message: string;
  languageBarrier: boolean;
  sender: PopulatedDoc<Interface_User & Document>;
  receiver: PopulatedDoc<Interface_User & Document>;
  createdAt: Date;
}

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
    default: dayjs(Date.now()),
  },
});

const MessageChatModel = () =>
  model<Interface_MessageChat>("MessageChat", messageChatSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const MessageChat = (models.MessageChat ||
  MessageChatModel()) as ReturnType<typeof MessageChatModel>;
