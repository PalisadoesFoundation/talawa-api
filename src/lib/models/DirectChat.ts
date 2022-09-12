import { Schema, model, PopulatedDoc, Types, Document } from 'mongoose';
import { Interface_DirectChatMessage } from './DirectChatMessage';
import { Interface_Organization } from './Organization';
import { Interface_User } from './User';

export interface Interface_DirectChat {
  _id: Types.ObjectId;
  users: Array<PopulatedDoc<Interface_User & Document>>;
  messages: Array<PopulatedDoc<Interface_DirectChatMessage & Document>>;
  creator: PopulatedDoc<Interface_User & Document>;
  organization: PopulatedDoc<Interface_Organization & Document>;
  status: string;
}

const directChatSchema = new Schema({
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
