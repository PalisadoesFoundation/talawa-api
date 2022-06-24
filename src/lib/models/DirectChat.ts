import { Schema, Types, model, Model } from 'mongoose';

export interface IDirectChat {
  users: Array<Types.ObjectId>;
  messages: Array<Types.ObjectId>;
  creator: Types.ObjectId;
  organization: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const directChatSchema = new Schema<
  IDirectChat,
  Model<IDirectChat>,
  IDirectChat
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

export const DirectChat = model<IDirectChat>('DirectChat', directChatSchema);
