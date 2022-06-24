import { Schema, Types, model, Model } from 'mongoose';

export interface IMessageChat {
  message: string;
  languageBarrier?: boolean;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  createdAt: Date;
}

const messageChatSchema = new Schema<
  IMessageChat,
  Model<IMessageChat, {}, {}>,
  IMessageChat
>({
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
    ref: 'User',
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now()),
  },
});

export const Chat = model<IMessageChat>('MessageChat', messageChatSchema);
