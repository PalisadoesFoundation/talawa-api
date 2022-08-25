import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_Message {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  creator: Types.ObjectId;
  group: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const messageSchema = new Schema<
  Interface_Message,
  Model<Interface_Message>,
  Interface_Message
>({
  text: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: () => new Date(Date.now()),
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const Message = model<Interface_Message>('Message', messageSchema);
