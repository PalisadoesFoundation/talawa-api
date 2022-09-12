import { Schema, model, PopulatedDoc, Types, Document } from 'mongoose';
import { Interface_Group } from './Group';
import { Interface_User } from './User';

export interface Interface_Message {
  _id: Types.ObjectId;
  text: string;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  createdAt: Date;
  creator: PopulatedDoc<Interface_User & Document>;
  group: PopulatedDoc<Interface_Group & Document>;
  status: string;
}

const messageSchema = new Schema({
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
    default: Date.now,
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
