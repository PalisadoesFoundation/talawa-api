import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_GroupChat {
  title: string;
  users: Array<Types.ObjectId>;
  messages: Array<Types.ObjectId>;
  creator: Types.ObjectId;
  organization: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const groupChatSchema = new Schema<
  Interface_GroupChat,
  Model<Interface_GroupChat>,
  Interface_GroupChat
>({
  title: {
    type: String,
    required: true,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: 'GroupChatMessage',
    },
  ],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const GroupChat = model<Interface_GroupChat>(
  'GroupChat',
  groupChatSchema
);
