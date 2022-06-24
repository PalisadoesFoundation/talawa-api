import { Schema, Types, model, Model } from 'mongoose';

export interface IDirectChatMessage {
  directChatMessageBelongsTo: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  createdAt: Date;
  messageContent: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const directChatMessageSchema = new Schema<
  IDirectChatMessage,
  Model<IDirectChatMessage>,
  IDirectChatMessage
>({
  directChatMessageBelongsTo: {
    type: Schema.Types.ObjectId,
    ref: 'DirectChat',
    required: true,
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
  },
  messageContent: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const DirectChatMessage = model<IDirectChatMessage>(
  'DirectChatMessage',
  directChatMessageSchema
);
