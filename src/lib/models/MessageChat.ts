import { Schema, model, PopulatedDoc, Types, Document } from 'mongoose';
import { Interface_User } from './User';

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
    default: Date.now,
  },
});

export const MessageChat = model<Interface_MessageChat>(
  'MessageChat',
  messageChatSchema
);
