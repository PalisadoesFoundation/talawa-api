import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_MembershipRequest {
  organization: Types.ObjectId;
  user?: Types.ObjectId;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const membershipRequestSchema = new Schema<
  Interface_MembershipRequest,
  Model<Interface_MembershipRequest>,
  Interface_MembershipRequest
>({
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
