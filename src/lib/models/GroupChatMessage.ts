import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_GroupChatMessage {
  groupChatMessageBelongsTo: Types.ObjectId;
  sender: Types.ObjectId;
  createdAt: Date;
  messageContent: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const groupChatMessageSchema = new Schema<
  Interface_GroupChatMessage,
  Model<Interface_GroupChatMessage>,
  Interface_GroupChatMessage
>({
  groupChatMessageBelongsTo: {
    type: Schema.Types.ObjectId,
    ref: 'GroupChat',
    required: true,
  },
  sender: {
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

export const GroupChatMessage = model<Interface_GroupChatMessage>(
  'GroupChatMessage',
  groupChatMessageSchema
);
