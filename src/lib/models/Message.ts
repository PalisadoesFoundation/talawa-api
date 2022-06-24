import { Schema, Types, model, Model } from 'mongoose';

export interface IMessageSchema {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: Date;
  creator: Types.ObjectId;
  group: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const messageSchema = new Schema<
  IMessageSchema,
  Model<IMessageSchema>,
  IMessageSchema
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

export const Message = model<IMessageSchema>('Message', messageSchema);
