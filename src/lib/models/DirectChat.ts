import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_DirectChat {
  users: Array<Types.ObjectId>;
  messages: Array<Types.ObjectId>;
  creator: Types.ObjectId;
  organization: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const directChatSchema = new Schema<
  Interface_DirectChat,
  Model<Interface_DirectChat>,
  Interface_DirectChat
>({
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
      ref: 'DirectChatMessage',
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

export const DirectChat = model<Interface_DirectChat>(
  'DirectChat',
  directChatSchema
);
