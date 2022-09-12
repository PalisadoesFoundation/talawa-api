import { Schema, model, Model, PopulatedDoc, Types, Document } from 'mongoose';
import { Interface_Organization } from './Organization';
import { Interface_User } from './User';

export interface Interface_MembershipRequest {
  _id: Types.ObjectId;
  organization: PopulatedDoc<Interface_Organization & Document>;
  user: PopulatedDoc<Interface_User & Document> | undefined;
  status: string;
}

const membershipRequestSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

export const MembershipRequest = model<Interface_MembershipRequest>(
  'MembershipRequest',
  membershipRequestSchema
);
